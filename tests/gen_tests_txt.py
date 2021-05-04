import csv
import fileinput
import hashlib
import unicodedata
import sys

LEFT_JUST_SIZE = 50

filtro_tipo = sys.argv[1]
del sys.argv[1]

reader = csv.reader(fileinput.input())

assert next(reader)[:6] == ['escritoPor', 'tipo de test', 'expresion', 'deberiaEvaluarA', 'comentario', 'deshabilitado...']
print("-- autogenerado del csv")

for row in reader:
    escritoPor, tipoTest, expresion, deberiaEvaluarA, comentario, *deshabilitadoHasta = row
    if tipoTest != filtro_tipo:
        print('-- (linea que no es un caso de tipo "{}")'.format(filtro_tipo))
        continue

    if ''.join(deshabilitadoHasta):
        print('-- deshabilitadoHasta({}): '.format(','.join(deshabilitadoHasta)), end='')

    if expresion.lower() in ("true", "false"):
        expresion = expresion.lower()

    if deberiaEvaluarA.lower() in ("true", "false"):
        deberiaEvaluarA = deberiaEvaluarA.lower()

    joiner = {
                "eval":    " -> ",
                "igobs":   " = ",
                "noigobs": " = ",
             }

    trailer = {
                "igobs":   " -> true",
                "noigobs": " -> false",
             }

    print(("".join([expresion.strip().ljust(LEFT_JUST_SIZE),
                   joiner.get(tipoTest, ""),
                   deberiaEvaluarA.strip()]) +
          trailer.get(tipoTest, "") +
          ((" --" + comentario) if comentario else "")).rstrip())
