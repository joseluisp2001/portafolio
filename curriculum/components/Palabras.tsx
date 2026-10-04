import { Fragment, type CSSProperties } from 'react';

/*
  Un titulo partido en palabras, cada una dentro de su mascara, para que puedan
  subir de a una desde atras de la linea.

  Se parte en el servidor y no con JavaScript en el navegador: el HTML ya llega
  partido, React no tiene nada que corregir al hidratar, y un lector de pantalla
  lee la frase entera porque los espacios quedan como texto entre las palabras.

  Sin movimiento (papel, "reducir movimiento", sin JS) las mascaras no recortan
  nada y el titulo se lee igual que antes.
*/
export default function Palabras({ texto }: { texto: string }) {
  return texto.split(' ').map((palabra, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="mascara">
        <span className="palabra" style={{ '--i': i } as CSSProperties}>
          {palabra}
        </span>
      </span>
    </Fragment>
  ));
}
