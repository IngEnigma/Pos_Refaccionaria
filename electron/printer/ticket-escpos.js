const ESC = 0x1b;
const GS = 0x1d;

function text(value) {
    return Buffer.from(String(value ?? ''), 'ascii');
}

function command(...bytes) {
    return Buffer.from(bytes);
}

function line(value = '') {
    return Buffer.concat([
        text(value),
        Buffer.from('\n', 'ascii'),
    ]);
}

function center() {
    return command(ESC, 0x61, 0x01);
}

function left() {
    return command(ESC, 0x61, 0x00);
}

function bold(enabled = true) {
    return command(ESC, 0x45, enabled ? 0x01 : 0x00);
}

function doubleSize(enabled = true) {
    return command(
        GS,
        0x21,
        enabled ? 0x11 : 0x00
    );
}

function cut() {
    return command(
        GS,
        0x56,
        0x00
    );
}

function feed(lines = 3) {
    return command(
        ESC,
        0x64,
        lines
    );
}

function separator(width = 42) {
    return line('-'.repeat(width));
}

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function formatProduct(product) {
    const name = String(product.nombre ?? '');
    const quantity = Number(product.cantidad ?? 0);
    const subtotal = money(product.subtotal);

    const prefix = `${quantity}x `;
    const availableNameLength = 42 - prefix.length - subtotal.length - 1;

    let shortName = name;

    if (shortName.length > availableNameLength) {
        shortName =
            shortName.substring(0, Math.max(0, availableNameLength - 3)) +
            '...';
    }

    const leftPart = `${prefix}${shortName}`;
    const spaces = Math.max(
        1,
        42 - leftPart.length - subtotal.length
    );

    return line(
        leftPart + ' '.repeat(spaces) + subtotal
    );
}

function generateTicket(ticket) {
    const chunks = [];

    // Inicializar impresora
    chunks.push(
        command(ESC, 0x40)
    );

    // Encabezado
    chunks.push(center());
    chunks.push(bold(true));
    chunks.push(doubleSize(true));
    chunks.push(line('REFACCIONARIA'));
    chunks.push(doubleSize(false));
    chunks.push(bold(false));

    if (ticket.sucursal) {
        chunks.push(line(ticket.sucursal));
    }

    chunks.push(line(''));

    // Información de venta
    chunks.push(left());

    chunks.push(
        line(`Folio: ${ticket.folio ?? ''}`)
    );

    if (ticket.fecha) {
        const fecha = new Date(ticket.fecha);

        chunks.push(
            line(`Fecha: ${fecha.toLocaleString('es-MX')}`)
        );
    }

    if (ticket.vendedor) {
        chunks.push(
            line(`Vendedor: ${ticket.vendedor}`)
        );
    }

    if (ticket.metodo_pago) {
        chunks.push(
            line(`Pago: ${ticket.metodo_pago}`)
        );
    }

    chunks.push(separator());

    // Productos
    for (const producto of ticket.productos ?? []) {
        chunks.push(
            formatProduct(producto)
        );
    }

    chunks.push(separator());

    // Total
    chunks.push(center());
    chunks.push(bold(true));
    chunks.push(doubleSize(true));

    chunks.push(
        line(`TOTAL ${money(ticket.total)}`)
    );

    chunks.push(doubleSize(false));
    chunks.push(bold(false));

    chunks.push(line(''));
    chunks.push(line('Gracias por su compra'));
    chunks.push(line(''));

    // Alimentar y cortar
    chunks.push(feed(4));
    chunks.push(cut());

    return Buffer.concat(chunks);
}

function generatePreview(ticket) {
    const lines = [];

    lines.push('==========================================');
    lines.push('              REFACCIONARIA');
    lines.push('==========================================');

    if (ticket.sucursal) {
        lines.push(ticket.sucursal);
    }

    lines.push('');

    lines.push(`Folio: ${ticket.folio ?? ''}`);

    if (ticket.fecha) {
        lines.push(
            `Fecha: ${new Date(ticket.fecha).toLocaleString('es-MX')}`
        );
    }

    if (ticket.vendedor) {
        lines.push(`Vendedor: ${ticket.vendedor}`);
    }

    if (ticket.metodo_pago) {
        lines.push(`Pago: ${ticket.metodo_pago}`);
    }

    lines.push('------------------------------------------');

    for (const producto of ticket.productos ?? []) {
        lines.push(
            formatProductPreview(producto)
        );
    }

    lines.push('------------------------------------------');
    lines.push('');
    lines.push(`TOTAL: ${money(ticket.total)}`);
    lines.push('');
    lines.push('            Gracias por su compra');
    lines.push('');
    lines.push('');
    lines.push('==========================================');

    return lines.join('\n');
}

function formatProductPreview(product) {
    const name = String(product.nombre ?? '');
    const quantity = Number(product.cantidad ?? 0);
    const subtotal = money(product.subtotal);

    const prefix = `${quantity}x `;
    const availableNameLength =
        42 - prefix.length - subtotal.length - 1;

    let shortName = name;

    if (shortName.length > availableNameLength) {
        shortName =
            shortName.substring(
                0,
                Math.max(0, availableNameLength - 3)
            ) + '...';
    }

    const leftPart = `${prefix}${shortName}`;

    const spaces = Math.max(
        1,
        42 - leftPart.length - subtotal.length
    );

    return leftPart + ' '.repeat(spaces) + subtotal;
}

module.exports = {
    generateTicket,
    generatePreview,
};