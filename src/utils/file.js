export const compressImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_W = 1200; const MAX_H = 1200;
                if (width > height) { if (width > MAX_W) { height *= MAX_W / width; width = MAX_W; } } 
                else { if (height > MAX_H) { width *= MAX_H / height; height = MAX_H; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            }
        }
    });
};