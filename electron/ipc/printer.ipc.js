const { ipcMain } = require('electron');

const {
    generateTicket,
    generatePreview,
} = require('../printer/ticket-escpos');

let isRegistered = false;

function registerPrinterIpc() {
    if (isRegistered) {
        return;
    }

    ipcMain.handle('printer:test', () => {
        console.log('[Printer] IPC funcionando');

        return {
            success: true,
            message: 'IPC de impresora funcionando',
        };
    });

    ipcMain.handle('printer:generate-ticket', (event, ticket) => {
        try {
            if (!ticket || typeof ticket !== 'object') {
                throw new Error('Datos de ticket inválidos');
            }

            const escposBuffer = generateTicket(ticket);
            const preview = generatePreview(ticket);

            console.log('[Printer] Ticket generado');
            console.log(`[Printer] Bytes ESC/POS: ${escposBuffer.length}`);
            console.log(preview);

            return {
                success: true,
                bytes: escposBuffer.length,
                preview,
            };
        } catch (error) {
            console.error(
                '[Printer] Error generando ticket:',
                error
            );

            return {
                success: false,
                message: error.message,
            };
        }
    });

    isRegistered = true;
}

module.exports = {
    registerPrinterIpc,
};