// modals.js
// Inject modern CSS rules dynamically
const css = `
.edu-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    opacity: 0;
    animation: eduFadeIn 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1);
}

.edu-modal-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 20px;
    width: 90%;
    max-width: 440px;
    padding: 28px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
    transform: scale(0.9);
    opacity: 0;
    animation: eduScaleUp 0.3s forwards cubic-bezier(0.34, 1.56, 0.64, 1);
    font-family: 'Inter', system-ui, sans-serif;
    color: #0f172a;
}

.edu-modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.edu-modal-icon {
    font-size: 24px;
}

.edu-modal-title {
    font-size: 19px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.edu-modal-body {
    font-size: 14.5px;
    font-weight: 500;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 24px;
}

.edu-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.edu-modal-btn {
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: inherit;
}

.edu-modal-btn-cancel {
    background: transparent;
    color: #475569;
    border: 1.5px solid rgba(15, 23, 42, 0.12);
}

.edu-modal-btn-cancel:hover {
    background: rgba(15, 23, 42, 0.05);
    color: #0f172a;
}

.edu-modal-btn-confirm {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}

.edu-modal-btn-confirm:hover {
    transform: translateY(-1.5px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
}

@keyframes eduFadeIn {
    to { opacity: 1; }
}

@keyframes eduScaleUp {
    to {
        transform: scale(1);
        opacity: 1;
    }
}
`;

// Inject styling into document head
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
}

// Global modal functions
export function showConfirm(message, title = 'Xác nhận hành động', icon = '❓') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'edu-modal-overlay';
        
        overlay.innerHTML = `
            <div class="edu-modal-card">
                <div class="edu-modal-header">
                    <span class="edu-modal-icon">${icon}</span>
                    <span class="edu-modal-title">${title}</span>
                </div>
                <div class="edu-modal-body">${message}</div>
                <div class="edu-modal-actions">
                    <button class="edu-modal-btn edu-modal-btn-cancel" id="eduModalCancel">Hủy bỏ</button>
                    <button class="edu-modal-btn edu-modal-btn-confirm" id="eduModalConfirm">Đồng ý</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const cleanup = (val) => {
            overlay.style.animation = 'eduFadeIn 0.2s reverse forwards';
            overlay.querySelector('.edu-modal-card').style.animation = 'eduScaleUp 0.2s reverse forwards';
            setTimeout(() => {
                overlay.remove();
                resolve(val);
            }, 200);
        };
        
        overlay.querySelector('#eduModalCancel').onclick = () => cleanup(false);
        overlay.querySelector('#eduModalConfirm').onclick = () => cleanup(true);
        overlay.onclick = (e) => {
            if (e.target === overlay) cleanup(false);
        };
    });
}

export function showAlert(message, title = 'Thông báo', icon = '🔔') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'edu-modal-overlay';
        
        overlay.innerHTML = `
            <div class="edu-modal-card">
                <div class="edu-modal-header">
                    <span class="edu-modal-icon">${icon}</span>
                    <span class="edu-modal-title">${title}</span>
                </div>
                <div class="edu-modal-body">${message}</div>
                <div class="edu-modal-actions">
                    <button class="edu-modal-btn edu-modal-btn-confirm" style="width: 100%; text-align: center;" id="eduModalOk">Đóng</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const cleanup = () => {
            overlay.style.animation = 'eduFadeIn 0.2s reverse forwards';
            overlay.querySelector('.edu-modal-card').style.animation = 'eduScaleUp 0.2s reverse forwards';
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 200);
        };
        
        overlay.querySelector('#eduModalOk').onclick = () => cleanup();
        overlay.onclick = (e) => {
            if (e.target === overlay) cleanup();
        };
    });
}
