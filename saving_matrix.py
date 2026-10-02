import random


def generar_matriz_cuadrada(N, n, multiplo=10):
    """
    Genera una matriz cuadrada n×n con valores múltiplos de `multiplo`,
    todos >= `multiplo`, cuya suma total sea exactamente N.
    
    Args:
        N (int): Suma total deseada. Debe ser múltiplo de `multiplo`
                 y >= multiplo * n².
        n (int): Lado de la matriz (n×n).
        multiplo (int): Base de los múltiplos (por defecto 10).
    
    Returns:
        list[list[int]]: Matriz n×n con los valores.
    
    Raises:
        ValueError: Si los parámetros no son válidos.
    """
    # --- Validaciones ---
    if not isinstance(n, int) or n < 1:
        raise ValueError(f"n debe ser un entero >= 1. Recibido: {n}")
    if not isinstance(multiplo, int) or multiplo < 1:
        raise ValueError(f"multiplo debe ser un entero >= 1. Recibido: {multiplo}")
    if N % multiplo != 0:
        raise ValueError(
            f"N debe ser múltiplo de {multiplo}. Recibido: {N}"
        )
    
    min_N = multiplo * n * n
    if N < min_N:
        raise ValueError(
            f"N debe ser al menos {min_N} para una matriz {n}×{n} "
            f"con valores >= {multiplo}. Recibido: {N}"
        )
    
    # --- Normalización ---
    num_celdas = n * n
    M = N // multiplo           # suma objetivo en unidades de `multiplo`
    K = M - num_celdas          # unidades libres a repartir (K >= 0)
    num_barras = num_celdas - 1
    
    # --- Stars and Bars ---
    total_posiciones = K + num_barras
    barras = sorted(random.sample(range(total_posiciones), num_barras))
    
    # --- Calcular x_i como diferencias entre barras consecutivas ---
    borde_izq = -1
    borde_der = total_posiciones  # = K + num_celdas - 1
    
    x = []
    anterior = borde_izq
    for b in barras:
        x.append(b - anterior)
        anterior = b
    x.append(borde_der - anterior)
    
    # x tiene num_celdas valores >= 1, suman M
    
    # --- Volver a escala original ---
    valores = [xi * multiplo for xi in x]
    
    # --- Barajar ---
    random.shuffle(valores)
    
    # --- Construir matriz n×n ---
    matriz = [valores[i*n:(i+1)*n] for i in range(n)]
    
    # --- Verificación ---
    suma = sum(sum(fila) for fila in matriz)
    assert suma == N, f"Error interno: suma = {suma}, esperado = {N}"
    
    return matriz


def imprimir_matriz(matriz):
    """Imprime la matriz en formato legible y alineado."""
    n = len(matriz)
    ancho = max(len(str(v)) for fila in matriz for v in fila)
    ancho = max(ancho, 4)
    
    linea = "─" * (n * (ancho + 3) + 1)
    
    print("\n┌" + linea + "┐")
    for fila in matriz:
        fila_str = " │ ".join(f"{v:>{ancho}}" for v in fila)
        print(f"│ {fila_str} │")
    print("└" + linea + "┘")


def main():
    MULTIPLO = 10  # cambia a 5 si quieres volver al comportamiento anterior
    
    print("=" * 60)
    print(f"  Generador de matriz n×n con suma exacta (múltiplos de {MULTIPLO})")
    print("=" * 60)
    print("Reglas:")
    print(f"  • Matriz cuadrada de tamaño n×n")
    print(f"  • Todos los valores son múltiplos de {MULTIPLO}")
    print(f"  • Todos los valores son >= {MULTIPLO}")
    print(f"  • La suma total es exactamente N")
    print(f"  • N debe ser múltiplo de {MULTIPLO} y >= {MULTIPLO}·n²")
    print("=" * 60)
    
    while True:
        entrada_n = input("\nIntroduce el tamaño n (o 'q' para salir): ").strip()
        if entrada_n.lower() == 'q':
            print("¡Hasta luego!")
            break
        
        try:
            n = int(entrada_n)
            if n < 1:
                print("⚠️  Error: n debe ser al menos 1.")
                continue
        except ValueError:
            print("⚠️  Error: introduce un número entero válido para n.")
            continue
        
        min_N = MULTIPLO * n * n
        print(f"   → Para n = {n}, la matriz tendrá {n*n} celdas.")
        print(f"   → N mínimo requerido: {min_N}")
        
        entrada_N = input(
            f"\nIntroduce N (múltiplo de {MULTIPLO}, >= {min_N}): "
        ).strip()
        
        try:
            N = int(entrada_N)
        except ValueError:
            print("⚠️  Error: introduce un número entero válido para N.")
            continue
        
        try:
            matriz = generar_matriz_cuadrada(N, n, multiplo=MULTIPLO)
        except ValueError as e:
            print(f"⚠️  Error: {e}")
            continue
        
        imprimir_matriz(matriz)
        suma = sum(sum(fila) for fila in matriz)
        print(f"\n✅ Suma total: {suma}  (esperado: {N})")
        print(f"   Tamaño: {n}×{n} = {n*n} celdas")
        print(f"   Múltiplos de {MULTIPLO}: "
              f"{all(v % MULTIPLO == 0 for fila in matriz for v in fila)}")
        print(f"   Todos >= {MULTIPLO}: "
              f"{all(v >= MULTIPLO for fila in matriz for v in fila)}")
        print(f"   Valor máximo: {max(v for fila in matriz for v in fila)}")


if __name__ == "__main__":
    main()