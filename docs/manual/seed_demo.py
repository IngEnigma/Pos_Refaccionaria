"""Datos de ejemplo para las capturas del manual (BD SQLite local, NO producción).

Uso, desde una copia del backend (RefaccionariaBack) ya migrada:
    DEBUG=True python manage.py shell < /ruta/FrontTRT/docs/manual/seed_demo.py

Cuentas demo (solo BD local de capturas):
    gerente.demo / Demo2026!   rol encargado, sucursal 1
    cajero.demo  / Demo2026!   rol cajero,    sucursal 1
"""
import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.utils import timezone

from clientes.models import Cliente
from inventario.models import PrecioSucursal
from inventario.services.movimiento_inventario_service import MovimientoInventarioService
from notifications.models import Notification
from producto.models import Producto, Proveedor, Tipo
from sucursales.models import Sucursal
from usuario.models import Perfil
from ventas.models import MetodoPago, Venta
from ventas.services.venta_service import VentaService

random.seed(7)
PASS = "Demo2026!"

centro = Sucursal.objects.create(nombre_sucursal="Matriz Tlalnepantla", ubicacion="Av. Gustavo Baz 120, Tlalnepantla, Edo. Méx.",
                                 codigo_postal="54030", numero_telefono="5553901234", correo_electronico="matriz@trt.com.mx")
Sucursal.objects.create(nombre_sucursal="Sucursal Naucalpan", ubicacion="Blvd. Toluca 455, Naucalpan, Edo. Méx.",
                        codigo_postal="53370", numero_telefono="5553765432", correo_electronico="naucalpan@trt.com.mx")


def usuario(username, nombre, apellido, rol, staff=False):
    u = User.objects.create_user(username=username, password=PASS, email=f"{username}@trt.com.mx",
                                 first_name=nombre, last_name=apellido, is_staff=staff)
    Perfil.objects.update_or_create(usuario=u, defaults={"id_sucursal": centro, "rol": rol})
    return u


gerente = usuario("gerente.demo", "Laura", "Hernández", "encargado")
cajeros = [usuario("cajero.demo", "Miguel", "Ramírez", "cajero"),
           usuario("ana.lopez", "Ana", "López", "cajero"),
           usuario("jose.martinez", "José", "Martínez", "cajero")]

MetodoPago.objects.create(tipo="Efectivo", descripcion="Pago en efectivo")  # id 1 (el front asume 1 = Efectivo)
MetodoPago.objects.create(tipo="Tarjeta", descripcion="Débito o crédito")   # id 2

tipos = {n: Tipo.objects.create(nombre=n) for n in
         ["Rodamientos", "Bandas", "Cadenas", "Retenes", "Chumaceras", "Poleas", "Lubricantes"]}

provs = [Proveedor.objects.create(nombre=n, telefono=t, correo=c, direccion=d) for n, t, c, d in [
    ("SKF de México S.A. de C.V.", "5550891200", "ventas@skf-mx.com", "Calz. de Tlalpan 3460, Coyoacán, CDMX"),
    ("Distribuidora Gates Industrial", "5552304567", "pedidos@gatesind.mx", "Av. Ceylán 959, Azcapotzalco, CDMX"),
    ("Rodamientos y Transmisiones del Norte", "8183456789", "contacto@rtnorte.mx", "Av. Ruiz Cortines 2100, Monterrey, N.L."),
    ("Lubricantes Industriales Mobil", "5557218800", "industrial@lubmobil.mx", "Vía Morelos 330, Ecatepec, Edo. Méx."),
    ("Cadenas y Engranes Tsubaki", "4422156070", "ventas@tsubaki-qro.mx", "Parque Industrial Querétaro, Qro."),
]]

PRODUCTOS = [  # (clave, nombre, descripción, marca, tipo, proveedor, costo, precio, stock)
    ("ROD-6203", "Rodamiento 6203-2RS", "Balero rígido de bolas sellado 17x40x12 mm", "SKF", "Rodamientos", 0, 58, 95, 48),
    ("ROD-6205", "Rodamiento 6205-ZZ", "Balero rígido de bolas blindado 25x52x15 mm", "SKF", "Rodamientos", 0, 72, 118, 36),
    ("ROD-6305", "Rodamiento 6305-2RS", "Balero serie pesada 25x62x17 mm", "NSK", "Rodamientos", 2, 110, 179, 22),
    ("ROD-32208", "Rodamiento cónico 32208", "Cono y taza 40x80x24.75 mm", "Timken", "Rodamientos", 2, 285, 449, 4),
    ("ROD-22212", "Rodamiento de rodillos 22212", "Rodillos esféricos 60x110x28 mm", "FAG", "Rodamientos", 0, 980, 1490, 7),
    ("BAN-A48", "Banda en V A-48", "Banda clásica sección A, 50 pulgadas exteriores", "Gates", "Bandas", 1, 89, 145, 60),
    ("BAN-B62", "Banda en V B-62", "Banda clásica sección B, 65 pulgadas exteriores", "Gates", "Bandas", 1, 132, 215, 31),
    ("BAN-5M800", "Banda dentada 5M-800", "Banda síncrona HTD paso 5 mm, ancho 15 mm", "Optibelt", "Bandas", 1, 240, 389, 12),
    ("CAD-40-1", "Cadena de rodillos ANSI 40-1", "Tramo de 3 m, paso 1/2 pulgada", "Tsubaki", "Cadenas", 4, 310, 499, 15),
    ("CAD-60-1", "Cadena de rodillos ANSI 60-1", "Tramo de 3 m, paso 3/4 pulgada", "Tsubaki", "Cadenas", 4, 520, 829, 3),
    ("RET-35528", "Retén 35x52x8", "Sello de aceite NBR doble labio", "National", "Retenes", 2, 28, 49, 80),
    ("RET-45628", "Retén 45x62x8", "Sello de aceite NBR doble labio", "National", "Retenes", 2, 34, 59, 70),
    ("CHU-UCP205", "Chumacera de piso UCP205", "Soporte de hierro fundido, flecha 25 mm", "NTN", "Chumaceras", 0, 165, 269, 18),
    ("CHU-UCF206", "Chumacera de pared UCF206", "Brida cuadrada, flecha 30 mm", "NTN", "Chumaceras", 0, 210, 339, 2),
    ("POL-2A60", "Polea 2A 6 pulgadas", "Polea de hierro 2 canales sección A", "Martin", "Poleas", 1, 260, 419, 9),
    ("LUB-EP2", "Grasa EP-2 cartucho 400 g", "Grasa de litio para rodamientos", "Mobil", "Lubricantes", 3, 64, 109, 45),
    ("LUB-ISO68", "Aceite para cadenas ISO 68, 1 L", "Lubricante para cadenas y transmisiones", "Mobil", "Lubricantes", 3, 118, 189, 26),
]

inv = MovimientoInventarioService()
productos = []
for i, (clave, nombre, desc, marca, tipo, prov, costo, precio, stock) in enumerate(PRODUCTOS):
    p = Producto.objects.create(clave=clave, nombre=nombre, descripcion=desc, marca=marca, id_tipo=tipos[tipo],
                                id_proveedor=provs[prov], codigo_barras=f"750100{i:06d}", costo=Decimal(costo),
                                precio_venta=Decimal(precio), codigoSAT="31171500")
    # Stock inicial alto: las ventas de abajo lo bajan al valor de la tabla aprox.
    inv.create({"id_producto": p.id, "id_sucursal": centro.id, "cantidad": stock + 10, "tipo": "ENTRADA",
                "razon": "Inventario inicial", "id_proveedor": provs[prov].id}, user=gerente)
    productos.append(p)

PrecioSucursal.objects.filter(id_producto=productos[0], id_sucursal=centro).delete()
PrecioSucursal.objects.create(id_producto=productos[0], id_sucursal=centro, precio_venta=Decimal("89.00"))
PrecioSucursal.objects.create(id_producto=productos[5], id_sucursal=centro, precio_venta=Decimal("139.00"))

for n, ap, am, tel, correo, rfc, dirc in [
    ("Roberto", "Sánchez", "Pérez", "5512345678", "rsanchez@tallerrs.mx", "SAPR800312KJ4", "Calle Industria 45, Tlalnepantla"),
    ("Mariana", "Gómez", "Ruiz", "5523456789", "mariana.gomez@gmail.com", "", ""),
    ("Transportes", "Del Valle", "", "5534567890", "compras@tdelvalle.mx", "TDV120415AB1", "Av. Mario Colín 210, Tlalnepantla"),
    ("Javier", "Torres", "Mendoza", "5545678901", "", "", ""),
    ("Agroindustrias", "La Loma", "", "5556789012", "mantenimiento@laloma.mx", "ALL090921QW3", "Carr. Cuautitlán km 3"),
    ("Patricia", "Flores", "Castillo", "5567890123", "pflores@hotmail.com", "FOCP850707HN2", ""),
]:
    Cliente.objects.create(id_sucursal=centro, nombre=n, apellido_paterno=ap, apellido_materno=am, telefono=tel,
                           correo=correo or None, rfc=rfc, direccion=dirc)

ventas = VentaService()
clientes = list(Cliente.objects.all())
ahora = timezone.now()
for k in range(14):
    lineas = [{"producto": p.id, "cantidad": random.randint(1, 2)} for p in random.sample(productos[:13], random.randint(1, 3))]
    data = {"id_metodo_pago": random.choice([1, 1, 2]), "detalles": lineas}
    if k % 3 == 0:
        data["id_cliente"] = random.choice(clientes).id
    v = ventas.crear_venta_completa(data, user=random.choice(cajeros + [gerente]))
    # fecha es auto_now_add: se reparte en los últimos días para que el historial luzca real.
    Venta.objects.filter(id=v["id"] if isinstance(v, dict) else v.id).update(
        fecha=ahora - timedelta(days=k // 3, hours=random.randint(0, 8), minutes=random.randint(0, 59)))

inv.create({"id_producto": productos[9].id, "id_sucursal": centro.id, "cantidad": 2, "tipo": "SALIDA",
            "razon": "Merma: eslabones dañados", "observaciones": "Detectado en revisión semanal"}, user=gerente)

Notification.objects.create(destinatario=gerente, tipo="info", titulo="Pedido recibido",
                            mensaje="Llegó el pedido de Distribuidora Gates Industrial. Registra la entrada en Inventario Sucursal.")

print("Seed OK:", Producto.objects.count(), "productos,", Venta.objects.count(), "ventas,",
      Notification.objects.count(), "notificaciones")
