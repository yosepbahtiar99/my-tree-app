import { useDialogStore } from '../store/dialogStore';

export default function GlobalDialogs() {
  const { 
    isAlertOpen, alertOptions, closeAlert,
    isConfirmOpen, confirmOptions, closeConfirm
  } = useDialogStore();

  const getAlertIcon = (type?: string) => {
    switch (type) {
      case 'success': return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4"><span className="text-2xl">✅</span></div>;
      case 'warning': return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4"><span className="text-2xl">⚠️</span></div>;
      case 'error': return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4"><span className="text-2xl">🚨</span></div>;
      default: return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4"><span className="text-2xl">ℹ️</span></div>;
    }
  };

  const getConfirmIcon = (type?: string) => {
    switch (type) {
      case 'danger': return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4"><span className="text-2xl">🗑️</span></div>;
      case 'warning': return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4"><span className="text-2xl">⚠️</span></div>;
      default: return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4"><span className="text-2xl">❓</span></div>;
    }
  };

  const getConfirmButtonClass = (type?: string) => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white';
      default: return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  return (
    <>
      {/* Alert Dialog */}
      {isAlertOpen && alertOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {getAlertIcon(alertOptions.type)}
              {alertOptions.title && (
                <h3 className="text-lg font-serif font-bold text-foreground mb-2">{alertOptions.title}</h3>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{alertOptions.message}</p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-center">
              <button
                onClick={closeAlert}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {isConfirmOpen && confirmOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {getConfirmIcon(confirmOptions.type)}
              {confirmOptions.title && (
                <h3 className="text-lg font-serif font-bold text-foreground mb-2">{confirmOptions.title}</h3>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{confirmOptions.message}</p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm w-full"
              >
                {confirmOptions.cancelText || 'Batal'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm w-full ${getConfirmButtonClass(confirmOptions.type)}`}
              >
                {confirmOptions.confirmText || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
