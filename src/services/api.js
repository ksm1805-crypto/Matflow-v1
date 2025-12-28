import { db, auth, storage } from '../firebase'; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const DB_COLLECTION = "matflow_data";

/**
 * [핵심] 파일 업로드 및 데이터 클리닝 함수
 * 데이터 내부를 재귀적으로 탐색하며 File 객체를 URL로 변환합니다.
 * ✅ 수정: 원본 파일명을 포함한 객체 반환
 */
const cleanAndUploadData = async (data) => {
    if (data === undefined || data === null) return null;

    // 1. 배열인 경우 (예: hplcSynFiles)
    if (Array.isArray(data)) {
        return Promise.all(data.map(item => cleanAndUploadData(item)));
    }

    // 2. FileList인 경우 (Input에서 갓 가져온 데이터)
    if (typeof FileList !== "undefined" && data instanceof FileList) {
        return data.length > 0 ? cleanAndUploadData(data[0]) : null;
    }

    // 3. 실제 파일(File) 객체인 경우 -> Firebase Storage에 업로드
    if (data instanceof File) {
        try {
            // 원본 파일명 저장 (나중에 표시용)
            const originalName = data.name;
            const fileType = data.type;
            
            // 파일명 중복 및 특수문자 방지를 위해 타임스탬프 결합
            const safeName = data.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storageRef = ref(storage, `uploads/${Date.now()}_${safeName}`);
            
            console.log(`📤 Uploading file: ${originalName}...`);
            const snapshot = await uploadBytes(storageRef, data);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log(`✅ Upload success: ${downloadURL}`);
            
            // ✅ 중요: URL뿐만 아니라 원본 파일명도 함께 저장
            return {
                name: originalName,
                url: downloadURL,
                type: fileType
            };
        } catch (e) {
            console.error("❌ File upload failed:", e);
            return null;
        }
    }

    // 4. 이미 업로드된 파일 객체인 경우 (name, url 포함) - 그대로 유지
    if (typeof data === 'object' && data.url && typeof data.url === 'string') {
        return data; // {name, url, type} 구조 유지
    }

    // 5. 날짜 객체인 경우
    if (data instanceof Date) return data.toISOString();

    // 6. 일반 객체인 경우 (Lot 데이터 등)
    if (typeof data === 'object') {
        const newData = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = await cleanAndUploadData(data[key]);
            }
        }
        return newData;
    }

    // 7. 기본 타입 (문자열, 숫자 등)
    return data;
};

/**
 * Materials 저장용 직렬화 (2중 배열 방지 포함)
 */
const serializeMaterial = async (material) => {
    // 파일 업로드 수행
    let mat = await cleanAndUploadData(material);

    // hplcGrid (2중 배열)를 Firestore가 수용 가능한 문자열로 변환
    if (mat && mat.lots && Array.isArray(mat.lots)) {
        mat.lots = mat.lots.map(lot => {
            ['hplcGrid', 'hplcGridP', 'hplcGridN', 'hplcGrid3'].forEach(key => {
                if (lot[key] && Array.isArray(lot[key])) {
                    lot[key] = JSON.stringify(lot[key]);
                }
            });
            return lot;
        });
    }
    return mat;
};

/**
 * 불러온 데이터 복구 (문자열 -> 배열)
 */
const deserializeMaterial = (material) => {
    const mat = JSON.parse(JSON.stringify(material));
    if (mat.lots && Array.isArray(mat.lots)) {
        mat.lots = mat.lots.map(lot => {
            ['hplcGrid', 'hplcGridP', 'hplcGridN', 'hplcGrid3'].forEach(key => {
                if (lot[key] && typeof lot[key] === 'string') {
                    try { lot[key] = JSON.parse(lot[key]); } catch (e) { lot[key] = []; }
                }
            });
            return lot;
        });
    }
    return mat;
};

export const api = {
    auth: {
        login: async (email, password) => {
            const res = await signInWithEmailAndPassword(auth, email, password);
            return { id: res.user.uid, username: email, name: email.split('@')[0], roleId: 'USER', email: email };
        },
        logout: async () => await signOut(auth)
    },
    materials: {
        getAll: async () => {
            const docSnap = await getDoc(doc(db, DB_COLLECTION, "materials"));
            if (docSnap.exists()) {
                const list = docSnap.data().list || [];
                return list.map(item => deserializeMaterial(item));
            }
            return [];
        },
        saveAll: async (materialsData) => {
            // 모든 항목을 병렬로 업로드 및 정제
            const serializedList = await Promise.all(materialsData.map(item => serializeMaterial(item)));
            await setDoc(doc(db, DB_COLLECTION, "materials"), { 
                list: serializedList,
                lastUpdated: new Date().toISOString()
            });
            return true;
        }
    },
    inventory: {
        getGlobal: async () => {
            const docSnap = await getDoc(doc(db, DB_COLLECTION, "inventory"));
            return docSnap.exists() ? docSnap.data().list || [] : [];
        },
        saveGlobal: async (inv) => {
            const cleaned = await Promise.all(inv.map(item => cleanAndUploadData(item)));
            await setDoc(doc(db, DB_COLLECTION, "inventory"), { list: cleaned });
        }
    },
    production: {
        getAll: async () => {
            const docSnap = await getDoc(doc(db, DB_COLLECTION, "production"));
            return docSnap.exists() ? docSnap.data().events || [] : [];
        },
        saveAll: async (events) => {
            const cleaned = await Promise.all(events.map(ev => cleanAndUploadData(ev)));
            await setDoc(doc(db, DB_COLLECTION, "production"), { events: cleaned });
        }
    }
};