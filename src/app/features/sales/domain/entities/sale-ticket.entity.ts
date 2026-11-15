export interface SaleTicketProductProps {
    nombre: string;
    cantidad: number;
    precioUnitario: string;
    subtotal: string;
}

export interface SaleTicketProps {
    folio: number;
    fecha: string | null;
    vendedor: string | null;
    metodoPago: string | null;
    sucursal: string | null;
    productos: SaleTicketProductProps[];
    subtotal: string;
    iva: string;
    total: string;
}

export class SaleTicket {
    readonly folio: number;
    readonly fecha: string | null;
    readonly vendedor: string | null;
    readonly metodoPago: string | null;
    readonly sucursal: string | null;
    readonly productos: readonly SaleTicketProductProps[];
    readonly subtotal: string;
    readonly iva: string;
    readonly total: string;

    constructor(props: SaleTicketProps) {
        this.folio = props.folio;
        this.fecha = props.fecha;
        this.vendedor = props.vendedor;
        this.metodoPago = props.metodoPago;
        this.sucursal = props.sucursal;
        this.productos = props.productos;
        this.subtotal = props.subtotal;
        this.iva = props.iva;
        this.total = props.total;
    }
}