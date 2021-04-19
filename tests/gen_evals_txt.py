import csv
import fileinput
import hashlib
import unicodedata

reader = csv.reader(fileinput.input())

assert next(reader)[:6] == ['escritoPor', 'tipo de test', 'expresion', 'deberiaEvaluarA', 'comentario', 'deshabilitado...']
print("-- autogenerado del csv")

for row in reader:
    escritoPor, tipoTest, expresion, deberiaEvaluarA, comentario, *deshabilitadoHasta = row
    if tipoTest != "eval":
        print('-- (linea que no es un caso de eval)')
        continue

    if ''.join(deshabilitadoHasta):
        print('-- deshabilitadoHasta({}): '.format(','.join(deshabilitadoHasta)), end='')

    if expresion.lower() in ("true", "false"):
        expresion = expresion.lower()

    if deberiaEvaluarA.lower() in ("true", "false"):
        deberiaEvaluarA = deberiaEvaluarA.lower()
    print("".join([expresion.strip(), " = ", deberiaEvaluarA.strip()]) + ((" --" + comentario) if comentario else ""))
