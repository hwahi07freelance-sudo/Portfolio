/**
 * WahiOS v11.0 - Professional Grade
 * Industrial Split: Stdout vs Stderr | Perfect Redirection | Quote Awareness
 */

class WahiTerminal {
    constructor() {
        this.container = document.getElementById('terminal-container');
        this.overlay = document.getElementById('terminal-overlay');
        this.term = null;
        this.fitAddon = null;
        
        this.user = 'hardikwahi';
        this.hostname = 'wahios';
        this.cwd = '/home/hardik';
        this.history = [];
        this.historyIndex = -1;
        this.currentLine = '';
        this.aliases = { 'll': 'ls -la', 'la': 'ls -a', 'cls': 'clear' };
        
        this.vfs = {
            'home': {
                'hardik': {
                    'about.txt': 'Full-stack Developer.\nStack: React, Next.js, Node.js.',
                    'projects': { 'avadh.md': 'Avadh Bizzhub Commercial Hub.' }
                }
            },
            'etc': { 'motd': 'WahiOS v11.0. Stdout/Stderr isolation active.' },
            'bin': {}, 'tmp': {}
        };

        this.init();
    }

    init() {
        this.term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#1a1b26',
                foreground: '#a9b1d6',
                cursor: '#c0caf5',
                black: '#15161e', red: '#f7768e', green: '#9ece6a',
                yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7',
                cyan: '#7dcfff', white: '#a9b1d6'
            },
            fontFamily: '"Fira Code", monospace',
            fontSize: 15
        });

        this.fitAddon = new FitAddon.FitAddon();
        this.term.loadAddon(this.fitAddon);
        this.term.open(this.container);
        this.fitAddon.fit();

        this.term.writeln('\x1b[1;32mWelcome to WahiOS v11.0 (zsh-pro)\x1b[0m');
        this.term.writeln('\x1b[38;5;244mStreaming Stderr Filter: Online. Redirection Logic: Hardened.\x1b[0m\r\n');
        this.prompt();
        this.setupEvents();
    }

    prompt() {
        if (!this.getNode(this.cwd)) this.cwd = '/home/hardik';
        const shortCwd = this.cwd.replace('/home/hardik', '~');
        this.term.write(`\r\x1b[1;32m➜ \x1b[1;34m${shortCwd} \x1b[1;35m(main) \x1b[0m`);
    }

    setupEvents() {
        this.term.onData(e => {
            switch (e) {
                case '\r': this.handleCommand(); break;
                case '\u007F': if (this.currentLine.length > 0) { this.currentLine = this.currentLine.slice(0, -1); this.term.write('\b \b'); } break;
                case '\u0003': this.term.write('^C\r\n'); this.currentLine = ''; this.prompt(); break;
                case '\u001b[A': this.navigateHistory(1); break;
                case '\u001b[B': this.navigateHistory(-1); break;
                case '\t': this.handleAutocomplete(); break;
                default: if (e >= ' ' && e <= '~') { this.currentLine += e; this.term.write(e); }
            }
        });
        document.querySelector('.control.green')?.addEventListener('click', () => this.close());
        window.addEventListener('resize', () => { if (this.overlay.classList.contains('active')) this.fitAddon.fit(); });
        this.overlay.addEventListener('click', () => this.term.focus());
    }

    parseLine(line) {
        const result = { command: '', args: [], redirection: null, file: null };
        const redirMatch = line.match(/(.*?)(\s*(>>|>)\s*)(.*)/);
        if (redirMatch) {
            line = redirMatch[1].trim();
            result.redirection = redirMatch[3] === '>>' ? 'append' : 'overwrite';
            result.file = redirMatch[4].trim();
        }
        const tokens = [];
        let cur = ''; let inQ = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQ = !inQ;
            else if (line[i] === ' ' && !inQ) { if (cur) tokens.push(cur); cur = ''; }
            else cur += line[i];
        }
        if (cur) tokens.push(cur);
        if (tokens.length) { result.command = tokens[0]; result.args = tokens.slice(1); }
        return result;
    }

    handleCommand() {
        const line = this.currentLine.trim();
        this.term.write('\r\n');
        if (line) {
            this.history.push(line);
            this.historyIndex = -1;
            const parsed = this.parseLine(line);
            
            if (parsed.command) {
                const response = this.execute(parsed.command, parsed.args);
                
                // Show errors immediately on screen (Always to stderr)
                if (response.stderr) {
                    this.term.writeln(response.stderr);
                }
                
                // Handle Redirection of STDOUT only
                if (parsed.redirection) {
                    if (!response.stderr) { // Success!
                        const info = this.getParent(this.resolvePath(parsed.file));
                        if (info?.parent) {
                            const out = response.stdout || '';
                            if (parsed.redirection === 'append' && info.parent[info.name]) {
                                info.parent[info.name] += '\n' + out;
                            } else {
                                info.parent[info.name] = out;
                            }
                        } else {
                            this.term.writeln(`zsh: no such file or directory: ${parsed.file}`);
                        }
                    }
                } else if (response.stdout) {
                    this.term.writeln(response.stdout);
                }
            }
        }
        this.currentLine = '';
        this.prompt();
    }

    getNode(path) {
        if (path === '/') return this.vfs;
        const parts = path.split('/').filter(Boolean);
        let curr = this.vfs;
        for (const p of parts) { if (!curr || typeof curr !== 'object' || !(p in curr)) return null; curr = curr[p]; }
        return curr;
    }

    getParent(path) {
        const parts = path.split('/').filter(Boolean);
        if (!parts.length) return null;
        const name = parts.pop();
        let curr = this.vfs;
        for (const p of parts) { if (!curr || typeof curr !== 'object' || !(p in curr)) return null; curr = curr[p]; }
        return { parent: curr, name };
    }

    resolvePath(target) {
        if (!target) return this.cwd;
        if (target === '~') return '/home/hardik';
        const parts = target.startsWith('/') ? [] : this.cwd.split('/').filter(Boolean);
        target.split('/').filter(Boolean).forEach(p => {
            if (p === '..') parts.length && parts.pop();
            else if (p !== '.') parts.push(p);
        });
        return '/' + parts.join('/');
    }

    execute(cmd, args) {
        const res = { stdout: '', stderr: '' };
        const print = (t) => res.stdout += t + '\n';
        const error = (t) => res.stderr = t;

        switch (cmd) {
            case 'ls':
                const node = this.getNode(this.resolvePath(args[0] || '.'));
                if (node && typeof node === 'object') print(Object.keys(node).join('  '));
                else error(`ls: ${args[0]}: No such directory`);
                break;
            case 'cd':
                const dest = this.resolvePath(args[0] || '~');
                if (this.getNode(dest) && typeof this.getNode(dest) === 'object') this.cwd = dest;
                else error(`zsh: no such file or directory: ${args[0] || ''}`);
                break;
            case 'cat':
                const f = this.getNode(this.resolvePath(args[0]));
                if (f && typeof f === 'string') print(f);
                else error(`cat: ${args[0]}: No such file or directory`);
                break;
            case 'echo': print(args.join(' ')); break;
            case 'mkdir': 
                args.forEach(n => { const i = this.getParent(this.resolvePath(n)); if (i?.parent) i.parent[i.name] = {}; });
                break;
            case 'touch':
                args.forEach(n => { const i = this.getParent(this.resolvePath(n)); if (i?.parent) i.parent[i.name] = ''; });
                break;
            case 'neofetch':
                print('\x1b[1;36m OS: \x1b[0m WahiOS v11.0\n\x1b[1;36m Shell: \x1b[0m zsh (Professional)');
                break;
            case 'say': const m = args.join(' '); print(`[Voice]: ${m}`); window.speechSynthesis.speak(new SpeechSynthesisUtterance(m)); break;
            case 'clear': this.term.clear(); break;
            case 'pwd': print(this.cwd); break;
            case 'exit': this.close(); break;
            case 'projects': window.location.href = 'projects.html'; break;
            case 'help': print('ls, cd, cat, echo, mkdir, touch, clear, pwd, neofetch, say, projects, exit'); break;
            default: error(`zsh: command not found: ${cmd}`);
        }
        res.stdout = res.stdout.trim();
        return res;
    }

    open() { this.overlay.classList.add('active'); setTimeout(() => { this.fitAddon.fit(); this.term.focus(); }, 100); document.body.style.overflow='hidden'; }
    close() { this.overlay.classList.remove('active'); document.body.style.overflow=''; }
    navigateHistory(d) {
        if (!this.history.length) return;
        if (d === 1) { if (this.historyIndex < this.history.length-1) this.historyIndex++; }
        else { if (this.historyIndex > -1) this.historyIndex--; }
        while (this.currentLine.length) { this.currentLine = this.currentLine.slice(0, -1); this.term.write('\b \b'); }
        if (this.historyIndex !== -1) { this.currentLine = this.history[this.history.length - 1 - this.historyIndex]; this.term.write(this.currentLine); }
    }
    handleAutocomplete() {
        const node = this.getNode(this.cwd);
        const opts = [...['help','ls','cd','cat','clear','pwd','neofetch','projects','exit'], ...Object.keys(node||{})];
        const last = this.currentLine.split(' ').pop();
        const m = opts.filter(o => o.startsWith(last));
        if (m.length === 1) { const comp = m[0].slice(last.length); this.currentLine += comp; this.term.write(comp); }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Terminal !== 'undefined') {
        const t = new WahiTerminal();
        window.openTerminal = t.open.bind(t);
    }
});
