#!/usr/bin/env python3

"""
OPTION 2: CLAUDELang Python 인터프리터

CLAUDELang JSON → Python AST → 실행

특징:
  • 모듈 호환성 문제 없음
  • 크로스 플랫폼
  • 성능 테스트 용이
"""

import json
import sys
import time
import os
from pathlib import Path
from typing import Any, Dict, List, Callable
from datetime import datetime


class CLAUDELangInterpreter:
    """CLAUDELang JSON 프로그램 실행 엔진"""

    def __init__(self):
        self.scope = {}
        self.output = []
        self.start_time = None
        self.stats = {
            'variables_created': 0,
            'functions_called': 0,
            'conditions_evaluated': 0,
            'execution_time_ms': 0
        }

    def load_program(self, file_path: str) -> Dict:
        """CLAUDELang JSON 프로그램 로드"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            raise Exception(f"프로그램 파일을 찾을 수 없음: {file_path}")
        except json.JSONDecodeError as e:
            raise Exception(f"JSON 파싱 오류: {e}")

    def execute(self, program: Dict) -> Dict:
        """프로그램 실행"""
        self.start_time = time.time()
        self.scope = {}
        self.output = []

        try:
            # 메타데이터 확인
            metadata = program.get('metadata', {})
            print(f"📌 프로그램: {metadata.get('title', 'Unknown')}")
            print(f"   설명: {metadata.get('description', '')}")
            print()

            # 명령어 실행
            instructions = program.get('instructions', [])
            for idx, instr in enumerate(instructions):
                self._execute_instruction(instr, idx)

            # 실행 통계
            self.stats['execution_time_ms'] = (
                time.time() - self.start_time
            ) * 1000

            return {
                'success': True,
                'output': self.output,
                'scope': self.scope,
                'stats': self.stats
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'output': self.output,
                'stats': self.stats
            }

    def _execute_instruction(self, instr: Dict, idx: int):
        """개별 명령어 실행"""
        instr_type = instr.get('type')

        if instr_type == 'comment':
            text = instr.get('text', '')
            print(f"[{idx}] 💬 {text}")

        elif instr_type == 'var':
            self._execute_var(instr)
            self.stats['variables_created'] += 1

        elif instr_type == 'call':
            self._execute_call(instr)
            self.stats['functions_called'] += 1

        elif instr_type == 'condition':
            self._execute_condition(instr)
            self.stats['conditions_evaluated'] += 1

        elif instr_type == 'return':
            pass  # 처리됨

        else:
            print(f"⚠️  알 수 없는 명령어 타입: {instr_type}")

    def _execute_var(self, instr: Dict):
        """변수 선언 및 할당"""
        name = instr.get('name')
        value_type = instr.get('value_type')
        value = instr.get('value')

        # 값 평가
        if isinstance(value, dict):
            if value.get('type') == 'array':
                # 배열 생성
                value = self._build_array(value.get('elements', []))
            elif value.get('type') == 'object':
                # 객체 생성
                value = self._build_object(value.get('properties', {}))

        self.scope[name] = value
        print(f"   ✓ {name}: {value_type} = {self._format_value(value)}")

    def _execute_call(self, instr: Dict):
        """함수 호출"""
        func_name = instr.get('function')
        args = instr.get('args', [])
        assign_to = instr.get('assign_to')

        # 인자 평가
        evaluated_args = [self._evaluate_expression(arg) for arg in args]

        # 함수 실행
        result = self._call_function(func_name, evaluated_args)

        # 결과 할당
        if assign_to:
            self.scope[assign_to] = result
            print(f"   ✓ {assign_to} = {func_name}(...) → {self._format_value(result)}")
        else:
            print(f"   ✓ {func_name}(...) → {self._format_value(result)}")

    def _execute_condition(self, instr: Dict):
        """조건문 실행 (if-else)"""
        test = instr.get('test', {})
        then_branch = instr.get('then', [])
        else_branch = instr.get('else', [])

        condition_result = self._evaluate_condition(test)
        self.stats['conditions_evaluated'] += 1

        print(f"   ? 조건: {condition_result}")

        if condition_result:
            print(f"   → THEN 블록 실행")
            for sub_instr in then_branch:
                self._execute_instruction(sub_instr, 0)
        else:
            print(f"   → ELSE 블록 실행")
            for sub_instr in else_branch:
                self._execute_instruction(sub_instr, 0)

    def _evaluate_expression(self, expr: Any) -> Any:
        """표현식 평가"""
        if isinstance(expr, dict):
            if expr.get('type') == 'literal':
                return expr.get('value')
            elif expr.get('type') == 'ref':
                return self.scope.get(expr.get('name'))
            elif expr.get('type') == 'property':
                obj = self.scope.get(expr.get('object'))
                if isinstance(obj, dict):
                    return obj.get(expr.get('property'))
            elif expr.get('type') == 'array':
                return self._build_array(expr.get('elements', []))
            elif expr.get('type') == 'object':
                return self._build_object(expr.get('properties', {}))
        return expr

    def _evaluate_condition(self, test: Dict) -> bool:
        """조건 평가"""
        if test.get('type') == 'comparison':
            operator = test.get('operator')
            left = self._evaluate_expression(test.get('left'))
            right = self._evaluate_expression(test.get('right'))

            if operator == '>=':
                return left >= right
            elif operator == '>':
                return left > right
            elif operator == '<=':
                return left <= right
            elif operator == '<':
                return left < right
            elif operator == '==':
                return left == right
            elif operator == '!=':
                return left != right

        return False

    def _call_function(self, func_name: str, args: List) -> Any:
        """VT 함수 호출"""
        # Array 함수
        if func_name == 'Array.filter':
            return self._array_filter(args[0], args[1] if len(args) > 1 else None)
        elif func_name == 'Array.map':
            return self._array_map(args[0], args[1] if len(args) > 1 else None)
        elif func_name == 'Array.reduce':
            return self._array_reduce(args[0], args[1], args[2] if len(args) > 2 else None)
        elif func_name == 'Array.length':
            return len(args[0]) if isinstance(args[0], (list, str)) else 0

        # Math 함수
        elif func_name == 'Math.add':
            return args[0] + args[1]
        elif func_name == 'Math.sub':
            return args[0] - args[1]
        elif func_name == 'Math.mul':
            return args[0] * args[1]
        elif func_name == 'Math.div':
            return args[0] // args[1] if isinstance(args[0], int) else args[0] / args[1]

        # IO 함수
        elif func_name == 'IO.print':
            output = str(args[0]) if args else ''
            self.output.append(output)
            print(f"   📤 {output}")
            return output

        else:
            raise Exception(f"알 수 없는 함수: {func_name}")

    def _array_filter(self, arr: List, predicate: Callable = None) -> List:
        """배열 필터링"""
        if not predicate:
            return arr
        return [x for x in arr if predicate(x)]

    def _array_map(self, arr: List, transformer: Callable = None) -> List:
        """배열 변환"""
        if not transformer:
            return arr
        return [transformer(x) for x in arr]

    def _array_reduce(self, arr: List, initial: Any, reducer: Callable = None) -> Any:
        """배열 감축"""
        result = initial
        if reducer:
            for item in arr:
                result = reducer(result, item)
        return result

    def _build_array(self, elements: List) -> List:
        """배열 생성"""
        return [self._evaluate_expression(elem) for elem in elements]

    def _build_object(self, properties: Dict) -> Dict:
        """객체 생성"""
        obj = {}
        for key, value in properties.items():
            obj[key] = self._evaluate_expression(value)
        return obj

    def _format_value(self, value: Any) -> str:
        """값 포맷팅"""
        if isinstance(value, list):
            return f"[{len(value)} items]"
        elif isinstance(value, dict):
            return f"{{...}} ({len(value)} props)"
        elif isinstance(value, str):
            return f'"{value}"'
        else:
            return str(value)


def main():
    """메인 실행"""
    print('\n╔═══════════════════════════════════════════════════════════╗')
    print('║  OPTION 2: Python 인터프리터                             ║')
    print('╚═══════════════════════════════════════════════════════════╝\n')

    # 프로그램 로드 및 실행
    program_path = 'test-ai-evaluation.clg'

    if not os.path.exists(program_path):
        print(f"❌ 프로그램을 찾을 수 없음: {program_path}")
        return

    interpreter = CLAUDELangInterpreter()

    try:
        # 프로그램 로드
        print(f'📂 프로그램 로드: {program_path}')
        program = interpreter.load_program(program_path)
        print(f'✅ 로드 성공\n')

        # 프로그램 실행
        print('⚙️  프로그램 실행:')
        print('─' * 60)
        result = interpreter.execute(program)

        print('─' * 60)
        print()

        # 결과 출력
        if result['success']:
            print('✅ 실행 성공')
            print(f"\n📊 실행 통계:")
            for stat, value in result['stats'].items():
                print(f"  • {stat}: {value}")

            print(f"\n📤 출력:")
            for line in result['output']:
                print(f"  {line}")

        else:
            print(f'❌ 실행 실패: {result["error"]}')

    except Exception as e:
        print(f'❌ 오류: {e}')
        import traceback
        traceback.print_exc()

    # 최종 평가
    print('\n')
    print('╔' + '═' * 59 + '╗')
    print('║  OPTION 2 평가' + ' ' * 44 + '║')
    print('╚' + '═' * 59 + '╝\n')

    print('✅ 장점:')
    print('  • 모듈 호환성 문제 없음')
    print('  • 크로스 플랫폼 (Linux/Mac/Windows)')
    print('  • Python 표준 라이브러리 활용 가능')
    print('  • 디버깅 쉬움\n')

    print('❌ 단점:')
    print('  • Python 의존성 추가')
    print('  • Node.js 생태계와 분리')
    print('  • 개발 환경 복잡도 증가\n')

    print('실용성 평가: ⭐⭐⭐⭐⭐ (5/5)')
    print('구현 난도: ⭐⭐ (중간)')
    print('구현 시간: 2-3시간\n')

    print('추천 대상: 장기 지원이 필요한 프로덕션 환경\n')

    print('═' * 60)


if __name__ == '__main__':
    main()
