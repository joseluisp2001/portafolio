import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { IconoWhatsApp } from '@/components/IconoWhatsApp';
import { listarProductos, type Producto } from '@/lib/productos';
import ProductGrid from '@/components/ProductGrid';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { site } from '@/config/site';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { buttonStyles } from '@/lib/button-styles';

// Se arma en cada visita. Sin esto Next la generaba al compilar: dentro de
// Docker no hay base durante el build, así que "no carga" quedaba guardado
// (caché de un año) y los productos cargados con AdminSQlito nunca aparecían.
export const dynamic = 'force-dynamic';

// Solo "Tienda": la plantilla del layout ya agrega " | Desamparados Tech".
// Antes decía "Tienda | Desamparados Tech" y el título salía con la marca dos veces.
export const metadata = {
  title: 'Tienda',
  description: site?.tienda?.description || 'Catálogo de productos',
};

export default async function TiendaPage() {
  // El tipo va explicito: arranca vacio y se llena dentro del try, asi que
  // TypeScript no lo puede inferir solo.
  let productos: Producto[] = [];
  let sinConexion = false;

  try {
    productos = await listarProductos();
  } catch (e) {
    console.error(e);
    sinConexion = true;
  }

  const vacia = sinConexion || productos.length === 0;

  return (
    <>
      <Header />

      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Franja oscura detrás del encabezado fijo, para que el menú se lea. */}
        <div className="bg-slate-900 pt-28 pb-12">
          <div className="container mx-auto px-4">
            <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 inline-block">
              &larr; Volver al inicio
            </Link>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              {site?.tienda?.title || 'Nuestra Tienda'}
            </h1>
            <p className="text-slate-300 max-w-2xl">
              {site?.tienda?.description || 'Explora nuestro catálogo de productos y servicios técnicos.'}
            </p>
          </div>
        </div>

        <main className="flex-grow container mx-auto px-4 py-12">
          {vacia ? (
            // Sin productos (o sin base) no se muestran filtros ni buscador:
            // "no hay productos con estos filtros" daba a entender que el
            // cliente había filtrado mal. Se le ofrece pedir por WhatsApp.
            <div className="mx-auto max-w-xl text-center bg-white border border-slate-200 rounded-2xl shadow-soft px-8 py-12">
              <PackageSearch className="w-12 h-12 mx-auto text-cyan-600 mb-4" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                {sinConexion ? 'El catálogo no carga en este momento' : 'Estamos armando el catálogo'}
              </h2>
              <p className="text-slate-600 mb-8">
                Conseguimos partes, cargadores, discos, memorias y accesorios por encargo.
                Escribinos qué necesitás y te pasamos precio y disponibilidad.
              </p>
              <a
                href={buildWhatsAppUrl({
                  source: sinConexion ? 'tienda_sin_conexion' : 'tienda_vacia',
                  message: 'Hola, busco un producto que no vi en la tienda:',
                })}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: 'primary', className: 'gap-2' })}
              >
                <IconoWhatsApp className="w-5 h-5" />
                Pedir por WhatsApp
              </a>
            </div>
          ) : (
            <ProductGrid productos={productos} />
          )}
        </main>

        <Footer />
      </div>

      <WhatsAppFab />
    </>
  );
}
