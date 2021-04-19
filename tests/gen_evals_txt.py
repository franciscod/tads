import csv
import fileinput
import hashlib
import unicodedata

reader = csv.reader(fileinput.input())

assert next(reader) == ['escritoPor', 'tipo de test', 'expresion', 'deberiaEvaluarA', 'comentario', 'deshabilitadoHasta']
print("-- autogenerado del csv")

for row in reader:
    escritoPor, tipoTest, expresion, deberiaEvaluarA, comentario, deshabilitadoHasta = row
    if tipoTest != "eval":
        print('-- (linea que no es un caso de eval)')
        continue

    if deshabilitadoHasta:
        print('-- deshabilitadoHasta({}): '.format(deshabilitadoHasta), end='')

    if expresion.lower() in ("true", "false"):
        expresion = expresion.lower()

    if deberiaEvaluarA.lower() in ("true", "false"):
        deberiaEvaluarA = deberiaEvaluarA.lower()
    print("".join([expresion.strip(), " = ", deberiaEvaluarA.strip()]) + ((" --" + comentario) if comentario else ""))
