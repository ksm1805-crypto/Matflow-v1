// src/utils/rdkit.js

let rdkitInstance = null;
let initPromise = null;

export const getRDKit = async () => {
    // 이미 로드되었으면 바로 반환
    if (rdkitInstance) return rdkitInstance;

    // 로딩 중이면 기다림 (중복 로딩 방지)
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve, reject) => {
        if (!window.initRDKitModule) {
            reject("RDKit script not loaded in index.html");
            return;
        }

        window.initRDKitModule()
            .then((instance) => {
                rdkitInstance = instance;
                console.log("RDKit.js Loaded Successfully!");
                resolve(instance);
            })
            .catch((e) => {
                console.error("RDKit Load Error:", e);
                reject(e);
            });
    });

    return initPromise;
};