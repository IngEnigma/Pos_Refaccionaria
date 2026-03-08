export interface MovementCreateRequestDto {
  tipo: string;
  cantidad: number;
  razon: string;
  observacion: string | null;
}
