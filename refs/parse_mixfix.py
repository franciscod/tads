# by tmlm

import re
from sys import stderr

class Parser(object):

    def __init__(self, input):
        self._input = re.sub('[ \t\r\n]+', ' ', input).strip(' \t\r\n').split(' ')
        self._i = 0
        self._table = [
            ('(associativity)', ['if_then_else_']),
            ('(associativity)', ['_or_']),
            ('(associativity)', ['_and_']),
            ('(associativity)', ['_+_', '_-_']),
            ('(associativity)', ['_*_', '_/_']),
        ]

    def reserved(self):
        reserved = set()
        for _, operators in self._table:
            for operator in operators:
                for part in operator.split('_'):
                    if part == '_': continue
                    reserved.add(part)
        return reserved

    def _currentToken(self):
        return self._input[self._i]

    def _nextToken(self):
        self._i += 1

    def _isEOF(self):
        return self._i >= len(self._input)

    def _isPrefixInLevel(self, status, level):
        for operator in self._table[level][1]:
            if operator.startswith(status):
                return True
        return False

    def parseAtom(self):
        tok = self._currentToken()
        self._nextToken()
        if tok == '(':
            res = self.parseExpr()
            assert self._currentToken() == ')'
            self._nextToken()
            return res
        else:
            return tok

    def parseExpr(self, level=0):
        if level == len(self._table):
            return self.parseAtom()

        status = ''
        children = []
        while not self._isEOF() and \
              self._currentToken() not in [')'] and \
              self._isPrefixInLevel(status, level):
            tok = self._currentToken()
            if tok in self.reserved():
                if not self._isPrefixInLevel(status + tok, level):
                    break
                status += tok
                self._nextToken()
            else:
                if status == '':
                    newLevel = level + 1
                else:
                    newLevel = level
                children.append(self.parseExpr(level=newLevel))
                status += '_'
            print (' ' * level + status, file=stderr)
            if status in self._table[level][1]:
                return [status] + children

        if status == '_':
            return children[0]
        else:
            raise Exception('Parse error.')

p = Parser('''
  if a and b + c * d
    then
      ( if c
         then d
         else e )
    else
      ( if f
         then g
         else h ) / w
''')
print(p.parseExpr())
