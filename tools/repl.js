#!/usr/bin/env node

/**
 * CLAUDELang v6.0 - Interactive REPL
 *
 * 사용법:
 *   node tools/repl.js
 *   또는 chmod +x tools/repl.js && ./tools/repl.js
 */

const readline = require('readline');
const { CLAUDELang } = require('../src/index.js');
const fs = require('fs');
const path = require('path');

class CLAUDELangREPL {
  constructor() {
    this.lang = new CLAUDELang();
    this.history = [];
    this.variables = {};
    this.functions = {};
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'claude> '
    });

    this.setupCommands();
  }

  /**
   * REPL 명령어 설정
   */
  setupCommands() {
    this.commands = {
      help: () => this.printHelp(),
      clear: () => {
        console.clear();
        this.printWelcome();
      },
      vars: () => this.printVariables(),
      funcs: () => this.printFunctions(),
      history: () => this.printHistory(),
      load: (file) => this.loadFile(file),
      save: (file) => this.saveHistory(file),
      exit: () => process.exit(0),
      quit: () => process.exit(0),
      reset: () => this.reset()
    };
  }

  /**
   * REPL 시작
   */
  start() {
    this.printWelcome();
    this.rl.prompt();

    this.rl.on('line', (line) => {
      this.processInput(line.trim());
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye! 👋');
      process.exit(0);
    });
  }

  /**
   * 입력 처리
   */
  processInput(input) {
    if (!input) return;

    // 히스토리에 저장
    this.history.push(input);

    // 명령어 확인
    const [cmd, ...args] = input.split(' ');

    if (this.commands[cmd]) {
      this.commands[cmd](...args);
      return;
    }

    // JSON 프로그램으로 해석 시도
    try {
      // 변수 할당 (var x = 42)
      const assignMatch = input.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, varName, expr] = assignMatch;
        const program = {
          version: '6.0',
          instructions: [
            { type: 'call', function: 'println', args: [{ type: 'literal', value_type: 'string', value: `${varName} = ${expr}` }] }
          ]
        };
        const result = this.lang.runProgram(program);
        this.variables[varName] = expr;
        console.log(`✓ ${varName} assigned`);
        return;
      }

      // 함수 호출 (println "hello")
      const callMatch = input.match(/^(\w+)\s*(.*)$/);
      if (callMatch) {
        const [, func, argsStr] = callMatch;
        const args = argsStr
          ? argsStr.split(/\s+/).map(arg => {
              if (arg.startsWith('"') && arg.endsWith('"')) {
                return { type: 'literal', value_type: 'string', value: arg.slice(1, -1) };
              }
              if (!isNaN(arg)) {
                return { type: 'literal', value_type: 'i32', value: parseInt(arg) };
              }
              return { type: 'ref', name: arg };
            })
          : [];

        const program = {
          version: '6.0',
          instructions: [
            { type: 'call', function: func, args }
          ]
        };

        const result = this.lang.runProgram(program);
        if (result.success) {
          if (result.output && result.output.length > 0) {
            console.log(result.output.join('\n'));
          }
          if (result.result !== null && result.result !== undefined) {
            console.log(`=> ${result.result}`);
          }
        } else {
          console.log(`❌ ${result.error}`);
        }
        return;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * 파일 로드
   */
  loadFile(filename) {
    try {
      const filePath = path.resolve(filename);
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const program = JSON.parse(content);
      const result = this.lang.runProgram(program);

      if (result.success) {
        console.log(`✓ Loaded and executed: ${filename}`);
        if (result.output && result.output.length > 0) {
          console.log(result.output.join('\n'));
        }
      } else {
        console.log(`❌ ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * 히스토리 저장
   */
  saveHistory(filename) {
    try {
      const filePath = path.resolve(filename);
      const content = this.history.join('\n');
      fs.writeFileSync(filePath, content);
      console.log(`✓ History saved to: ${filePath}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  /**
   * 상태 초기화
   */
  reset() {
    this.lang = new CLAUDELang();
    this.variables = {};
    this.functions = {};
    console.log('✓ State reset');
  }

  /**
   * 변수 출력
   */
  printVariables() {
    console.log('\n📦 Variables:');
    if (Object.keys(this.variables).length === 0) {
      console.log('  (none)');
    } else {
      Object.entries(this.variables).forEach(([name, value]) => {
        console.log(`  ${name} = ${value}`);
      });
    }
  }

  /**
   * 함수 출력
   */
  printFunctions() {
    console.log('\n⚙️  Built-in Functions:');
    const funcs = [
      'println', 'print', 'Array.map', 'Array.filter', 'Array.reduce',
      'String.split', 'String.upper', 'String.lower', 'Math.sqrt', 'Math.pow',
      'Map.create', 'Map.get', 'Map.set', 'Set.create', 'Set.add'
    ];
    funcs.forEach((f, i) => {
      if (i % 3 === 0) console.log('  ' + f.padEnd(20) + (i + 1 < funcs.length ? funcs[i + 1].padEnd(20) : '') + (i + 2 < funcs.length ? funcs[i + 2] : ''));
    });
  }

  /**
   * 히스토리 출력
   */
  printHistory() {
    console.log('\n📜 Command History:');
    this.history.slice(-10).forEach((cmd, i) => {
      console.log(`  ${i + 1}. ${cmd}`);
    });
  }

  /**
   * 도움말 출력
   */
  printHelp() {
    console.log('\n📚 Commands:');
    console.log('  help       - Show this help message');
    console.log('  clear      - Clear screen');
    console.log('  vars       - List all variables');
    console.log('  funcs      - List built-in functions');
    console.log('  history    - Show command history');
    console.log('  load FILE  - Load and execute a JSON file');
    console.log('  save FILE  - Save command history');
    console.log('  reset      - Reset state');
    console.log('  exit/quit  - Exit REPL');
    console.log('\n💡 Examples:');
    console.log('  > println "Hello, World!"');
    console.log('  > x = 42');
    console.log('  > load examples/simple.json');
    console.log('  > help');
  }

  /**
   * 환영 메시지
   */
  printWelcome() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  CLAUDELang v6.0 - Interactive REPL   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\nType "help" for available commands');
    console.log('Type "exit" to quit\n');
  }
}

// REPL 시작
const repl = new CLAUDELangREPL();
repl.start();
