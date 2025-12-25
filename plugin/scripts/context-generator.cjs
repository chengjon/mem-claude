"use strict";var Xe=Object.create;var Y=Object.defineProperty;var Be=Object.getOwnPropertyDescriptor;var Pe=Object.getOwnPropertyNames;var je=Object.getPrototypeOf,Ge=Object.prototype.hasOwnProperty;var We=(_,e)=>{for(var s in e)Y(_,s,{get:e[s],enumerable:!0})},Ee=(_,e,s,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of Pe(e))!Ge.call(_,n)&&n!==s&&Y(_,n,{get:()=>e[n],enumerable:!(t=Be(e,n))||t.enumerable});return _};var se=(_,e,s)=>(s=_!=null?Xe(je(_)):{},Ee(e||!_||!_.__esModule?Y(s,"default",{value:_,enumerable:!0}):s,_)),He=_=>Ee(Y({},"__esModule",{value:!0}),_);var ss={};We(ss,{generateContext:()=>es});module.exports=He(ss);var J=se(require("path"),1),Q=require("os"),P=require("fs");var Ae=require("bun:sqlite");var I=require("path"),Re=require("os"),fe=require("fs");var Ne=require("url");var B=require("fs"),Se=require("path"),be=require("os");var te=["bugfix","feature","refactor","discovery","decision","change"],re=["how-it-works","why-it-exists","what-changed","problem-solution","gotcha","pattern","trade-off"],me={bugfix:"\u{1F534}",feature:"\u{1F7E3}",refactor:"\u{1F504}",change:"\u2705",discovery:"\u{1F535}",decision:"\u2696\uFE0F","session-request":"\u{1F3AF}"},Te={discovery:"\u{1F50D}",change:"\u{1F6E0}\uFE0F",feature:"\u{1F6E0}\uFE0F",bugfix:"\u{1F6E0}\uFE0F",refactor:"\u{1F6E0}\uFE0F",decision:"\u2696\uFE0F"},ge=te.join(","),he=re.join(",");var ne=(o=>(o[o.DEBUG=0]="DEBUG",o[o.INFO=1]="INFO",o[o.WARN=2]="WARN",o[o.ERROR=3]="ERROR",o[o.SILENT=4]="SILENT",o))(ne||{}),oe=class{level=null;useColor;constructor(){this.useColor=process.stdout.isTTY??!1}getLevel(){if(this.level===null){let e=k.get("CLAUDE_MEM_LOG_LEVEL").toUpperCase();this.level=ne[e]??1}return this.level}correlationId(e,s){return`obs-${e}-${s}`}sessionId(e){return`session-${e}`}formatData(e){if(e==null)return"";if(typeof e=="string")return e;if(typeof e=="number"||typeof e=="boolean")return e.toString();if(typeof e=="object"){if(e instanceof Error)return this.getLevel()===0?`${e.message}
${e.stack}`:e.message;if(Array.isArray(e))return`[${e.length} items]`;let s=Object.keys(e);return s.length===0?"{}":s.length<=3?JSON.stringify(e):`{${s.length} keys: ${s.slice(0,3).join(", ")}...}`}return String(e)}formatTool(e,s){if(!s)return e;try{let t=typeof s=="string"?JSON.parse(s):s;if(e==="Bash"&&t.command)return`${e}(${t.command})`;if(t.file_path)return`${e}(${t.file_path})`;if(t.notebook_path)return`${e}(${t.notebook_path})`;if(e==="Glob"&&t.pattern)return`${e}(${t.pattern})`;if(e==="Grep"&&t.pattern)return`${e}(${t.pattern})`;if(t.url)return`${e}(${t.url})`;if(t.query)return`${e}(${t.query})`;if(e==="Task"){if(t.subagent_type)return`${e}(${t.subagent_type})`;if(t.description)return`${e}(${t.description})`}return e==="Skill"&&t.skill?`${e}(${t.skill})`:e==="LSP"&&t.operation?`${e}(${t.operation})`:e}catch{return e}}formatTimestamp(e){let s=e.getFullYear(),t=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0"),o=String(e.getHours()).padStart(2,"0"),a=String(e.getMinutes()).padStart(2,"0"),p=String(e.getSeconds()).padStart(2,"0"),u=String(e.getMilliseconds()).padStart(3,"0");return`${s}-${t}-${n} ${o}:${a}:${p}.${u}`}log(e,s,t,n,o){if(e<this.getLevel())return;let a=this.formatTimestamp(new Date),p=ne[e].padEnd(5),u=s.padEnd(6),l="";n?.correlationId?l=`[${n.correlationId}] `:n?.sessionId&&(l=`[session-${n.sessionId}] `);let E="";o!=null&&(this.getLevel()===0&&typeof o=="object"?E=`
`+JSON.stringify(o,null,2):E=" "+this.formatData(o));let T="";if(n){let{sessionId:h,sdkSessionId:f,correlationId:m,...r}=n;Object.keys(r).length>0&&(T=` {${Object.entries(r).map(([A,O])=>`${A}=${O}`).join(", ")}}`)}let R=`[${a}] [${p}] [${u}] ${l}${t}${T}${E}`;e===3?console.error(R):console.log(R)}debug(e,s,t,n){this.log(0,e,s,t,n)}info(e,s,t,n){this.log(1,e,s,t,n)}warn(e,s,t,n){this.log(2,e,s,t,n)}error(e,s,t,n){this.log(3,e,s,t,n)}dataIn(e,s,t,n){this.info(e,`\u2192 ${s}`,t,n)}dataOut(e,s,t,n){this.info(e,`\u2190 ${s}`,t,n)}success(e,s,t,n){this.info(e,`\u2713 ${s}`,t,n)}failure(e,s,t,n){this.error(e,`\u2717 ${s}`,t,n)}timing(e,s,t,n){this.info(e,`\u23F1 ${s}`,n,{duration:`${t}ms`})}happyPathError(e,s,t,n,o=""){let l=((new Error().stack||"").split(`
`)[2]||"").match(/at\s+(?:.*\s+)?\(?([^:]+):(\d+):(\d+)\)?/),E=l?`${l[1].split("/").pop()}:${l[2]}`:"unknown",T={...t,location:E};return this.warn(e,`[HAPPY-PATH] ${s}`,T,n),o}},d=new oe;var k=class{static DEFAULTS={CLAUDE_MEM_MODEL:"claude-sonnet-4-5",CLAUDE_MEM_CONTEXT_OBSERVATIONS:"50",CLAUDE_MEM_WORKER_PORT:"37777",CLAUDE_MEM_WORKER_HOST:"127.0.0.1",CLAUDE_MEM_SKIP_TOOLS:"ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion",CLAUDE_MEM_DATA_DIR:(0,Se.join)((0,be.homedir)(),".claude-mem"),CLAUDE_MEM_LOG_LEVEL:"INFO",CLAUDE_MEM_PYTHON_VERSION:"3.13",CLAUDE_CODE_PATH:"",CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT:"true",CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES:ge,CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS:he,CLAUDE_MEM_CONTEXT_FULL_COUNT:"5",CLAUDE_MEM_CONTEXT_FULL_FIELD:"narrative",CLAUDE_MEM_CONTEXT_SESSION_COUNT:"10",CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY:"true",CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE:"false"};static getAllDefaults(){return{...this.DEFAULTS}}static get(e){return this.DEFAULTS[e]}static getInt(e){let s=this.get(e);return parseInt(s,10)}static getBool(e){return this.get(e)==="true"}static loadFromFile(e){try{if(!(0,B.existsSync)(e))return this.getAllDefaults();let s=(0,B.readFileSync)(e,"utf-8"),t=JSON.parse(s),n=t;if(t.env&&typeof t.env=="object"){n=t.env;try{(0,B.writeFileSync)(e,JSON.stringify(n,null,2),"utf-8"),d.info("SETTINGS","Migrated settings file from nested to flat schema",{settingsPath:e})}catch(a){d.warn("SETTINGS","Failed to auto-migrate settings file",{settingsPath:e},a)}}let o={...this.DEFAULTS};for(let a of Object.keys(this.DEFAULTS))n[a]!==void 0&&(o[a]=n[a]);return o}catch(s){return d.warn("SETTINGS","Failed to load settings, using defaults",{settingsPath:e},s),this.getAllDefaults()}}};var Ye={};function Ve(){return typeof __dirname<"u"?__dirname:(0,I.dirname)((0,Ne.fileURLToPath)(Ye.url))}var Es=Ve(),D=k.get("CLAUDE_MEM_DATA_DIR"),ie=process.env.CLAUDE_CONFIG_DIR||(0,I.join)((0,Re.homedir)(),".claude"),ms=(0,I.join)(D,"archives"),Ts=(0,I.join)(D,"logs"),gs=(0,I.join)(D,"trash"),hs=(0,I.join)(D,"backups"),Ss=(0,I.join)(D,"settings.json"),Oe=(0,I.join)(D,"claude-mem.db"),bs=(0,I.join)(D,"vector-db"),Rs=(0,I.join)(ie,"settings.json"),fs=(0,I.join)(ie,"commands"),Ns=(0,I.join)(ie,"CLAUDE.md");function Ie(_){(0,fe.mkdirSync)(_,{recursive:!0})}var K=class{db;constructor(){Ie(D),this.db=new Ae.Database(Oe),this.db.run("PRAGMA journal_mode = WAL"),this.db.run("PRAGMA synchronous = NORMAL"),this.db.run("PRAGMA foreign_keys = ON"),this.initializeSchema(),this.ensureWorkerPortColumn(),this.ensurePromptTrackingColumns(),this.removeSessionSummariesUniqueConstraint(),this.addObservationHierarchicalFields(),this.makeObservationsTextNullable(),this.createUserPromptsTable(),this.ensureDiscoveryTokensColumn(),this.createPendingMessagesTable(),this.createAiResponsesAndToolExecutionsTables()}initializeSchema(){try{this.db.run(`
        CREATE TABLE IF NOT EXISTS schema_versions (
          id INTEGER PRIMARY KEY,
          version INTEGER UNIQUE NOT NULL,
          applied_at TEXT NOT NULL
        )
      `);let e=this.db.prepare("SELECT version FROM schema_versions ORDER BY version").all();(e.length>0?Math.max(...e.map(t=>t.version)):0)===0&&(d.info("DB","Initializing fresh database with migration004..."),this.db.run(`
          CREATE TABLE IF NOT EXISTS sdk_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claude_session_id TEXT UNIQUE NOT NULL,
            sdk_session_id TEXT UNIQUE,
            project TEXT NOT NULL,
            user_prompt TEXT,
            started_at TEXT NOT NULL,
            started_at_epoch INTEGER NOT NULL,
            completed_at TEXT,
            completed_at_epoch INTEGER,
            status TEXT CHECK(status IN ('active', 'completed', 'failed')) NOT NULL DEFAULT 'active'
          );

          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(claude_session_id);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status);
          CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC);

          CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            text TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery')),
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_observations_sdk_session ON observations(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
          CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
          CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at_epoch DESC);

          -- Composite indexes for optimized query performance
          CREATE INDEX IF NOT EXISTS idx_observations_project_type_created ON observations(project, type, created_at_epoch DESC);
          CREATE INDEX IF NOT EXISTS idx_observations_covering ON observations(created_at_epoch, id, project, type);

          CREATE TABLE IF NOT EXISTS session_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT UNIQUE NOT NULL,
            project TEXT NOT NULL,
            request TEXT,
            investigated TEXT,
            learned TEXT,
            completed TEXT,
            next_steps TEXT,
            files_read TEXT,
            files_edited TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
          CREATE INDEX IF NOT EXISTS idx_session_summaries_project ON session_summaries(project);
          CREATE INDEX IF NOT EXISTS idx_session_summaries_created ON session_summaries(created_at_epoch DESC);

          -- Composite index for session summary queries
          CREATE INDEX IF NOT EXISTS idx_session_summaries_project_created ON session_summaries(project, created_at_epoch DESC);
        `),this.db.prepare("INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)").run(4,new Date().toISOString()),d.success("DB","Migration004 applied successfully"))}catch(e){throw d.error("DB","Schema initialization error",{},e.message),e}}ensureWorkerPortColumn(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(5))return;this.db.query("PRAGMA table_info(sdk_sessions)").all().some(n=>n.name==="worker_port")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN worker_port INTEGER"),d.info("DB","Added worker_port column to sdk_sessions table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(5,new Date().toISOString())}catch(e){d.error("DB","Migration error",{},e.message)}}ensurePromptTrackingColumns(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(6))return;this.db.query("PRAGMA table_info(sdk_sessions)").all().some(u=>u.name==="prompt_counter")||(this.db.run("ALTER TABLE sdk_sessions ADD COLUMN prompt_counter INTEGER DEFAULT 0"),d.info("DB","Added prompt_counter column to sdk_sessions table")),this.db.query("PRAGMA table_info(observations)").all().some(u=>u.name==="prompt_number")||(this.db.run("ALTER TABLE observations ADD COLUMN prompt_number INTEGER"),d.info("DB","Added prompt_number column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(u=>u.name==="prompt_number")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN prompt_number INTEGER"),d.info("DB","Added prompt_number column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(6,new Date().toISOString())}catch(e){d.error("DB","Prompt tracking migration error",{},e.message)}}removeSessionSummariesUniqueConstraint(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(7))return;if(!this.db.query("PRAGMA index_list(session_summaries)").all().some(n=>n.unique===1)){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString());return}d.info("DB","Removing UNIQUE constraint from session_summaries.sdk_session_id..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
          CREATE TABLE session_summaries_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            request TEXT,
            investigated TEXT,
            learned TEXT,
            completed TEXT,
            next_steps TEXT,
            files_read TEXT,
            files_edited TEXT,
            notes TEXT,
            prompt_number INTEGER,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          )
        `),this.db.run(`
          INSERT INTO session_summaries_new
          SELECT id, sdk_session_id, project, request, investigated, learned,
                 completed, next_steps, files_read, files_edited, notes,
                 prompt_number, created_at, created_at_epoch
          FROM session_summaries
        `),this.db.run("DROP TABLE session_summaries"),this.db.run("ALTER TABLE session_summaries_new RENAME TO session_summaries"),this.db.run(`
          CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
          CREATE INDEX idx_session_summaries_project ON session_summaries(project);
          CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
        `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(7,new Date().toISOString()),d.success("DB","Successfully removed UNIQUE constraint from session_summaries.sdk_session_id")}catch(n){throw this.db.run("ROLLBACK"),n}}catch(e){d.error("DB","Migration error (remove UNIQUE constraint)",{},e.message)}}addObservationHierarchicalFields(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(8))return;if(this.db.query("PRAGMA table_info(observations)").all().some(n=>n.name==="title")){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString());return}d.info("DB"," Adding hierarchical fields to observations table..."),this.db.run(`
        ALTER TABLE observations ADD COLUMN title TEXT;
        ALTER TABLE observations ADD COLUMN subtitle TEXT;
        ALTER TABLE observations ADD COLUMN facts TEXT;
        ALTER TABLE observations ADD COLUMN narrative TEXT;
        ALTER TABLE observations ADD COLUMN concepts TEXT;
        ALTER TABLE observations ADD COLUMN files_read TEXT;
        ALTER TABLE observations ADD COLUMN files_modified TEXT;
      `),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(8,new Date().toISOString()),d.info("DB"," Successfully added hierarchical fields to observations table")}catch(e){d.error("DB"," Migration error (add hierarchical fields):",e.message)}}makeObservationsTextNullable(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(9))return;let t=this.db.query("PRAGMA table_info(observations)").all().find(n=>n.name==="text");if(!t||t.notnull===0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString());return}d.info("DB"," Making observations.text nullable..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
          CREATE TABLE observations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sdk_session_id TEXT NOT NULL,
            project TEXT NOT NULL,
            text TEXT,
            type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery', 'change')),
            title TEXT,
            subtitle TEXT,
            facts TEXT,
            narrative TEXT,
            concepts TEXT,
            files_read TEXT,
            files_modified TEXT,
            prompt_number INTEGER,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
          )
        `),this.db.run(`
          INSERT INTO observations_new
          SELECT id, sdk_session_id, project, text, type, title, subtitle, facts,
                 narrative, concepts, files_read, files_modified, prompt_number,
                 created_at, created_at_epoch
          FROM observations
        `),this.db.run("DROP TABLE observations"),this.db.run("ALTER TABLE observations_new RENAME TO observations"),this.db.run(`
          CREATE INDEX idx_observations_sdk_session ON observations(sdk_session_id);
          CREATE INDEX idx_observations_project ON observations(project);
          CREATE INDEX idx_observations_type ON observations(type);
          CREATE INDEX idx_observations_created ON observations(created_at_epoch DESC);
        `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(9,new Date().toISOString()),d.info("DB"," Successfully made observations.text nullable")}catch(n){throw this.db.run("ROLLBACK"),n}}catch(e){d.error("DB"," Migration error (make text nullable):",e.message)}}saveAiResponse(e){try{let t=this.db.prepare(`
        INSERT INTO ai_responses (
          claude_session_id, sdk_session_id, project, prompt_number,
          response_text, response_type, tool_name, tool_input, tool_output,
          created_at, created_at_epoch
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(e.claude_session_id,e.sdk_session_id,e.project,e.prompt_number,e.response_text,e.response_type,e.tool_name,e.tool_input,e.tool_output,e.created_at,e.created_at_epoch),n=Number(t.lastInsertRowid);return d.debug("DB","AI response saved",{aiResponseId:n,responseType:e.response_type}),n}catch(s){throw d.error("DB","Failed to save AI response",{responseType:e.response_type},s),s}}saveToolExecution(e){try{let t=this.db.prepare(`
        INSERT INTO tool_executions (
          ai_response_id, claude_session_id, sdk_session_id, project, prompt_number,
          tool_name, tool_input, tool_output, tool_duration_ms,
          files_created, files_modified, files_read, files_deleted,
          error_message, success, created_at, created_at_epoch
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(e.ai_response_id,e.claude_session_id,e.sdk_session_id,e.project,e.prompt_number,e.tool_name,e.tool_input,e.tool_output,e.tool_duration_ms,e.files_created,e.files_modified,e.files_read,e.files_deleted,e.error_message,e.success?1:0,e.created_at,e.created_at_epoch),n=Number(t.lastInsertRowid);return d.debug("DB","Tool execution saved",{toolExecutionId:n,toolName:e.tool_name,success:e.success}),n}catch(s){throw d.error("DB","Failed to save tool execution",{toolName:e.tool_name},s),s}}getRecentAiResponses(e,s=20){return this.db.prepare(`
      SELECT id, response_text, response_type, tool_name, prompt_number, created_at
      FROM ai_responses
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getRecentToolExecutions(e,s=50){return this.db.prepare(`
      SELECT id, tool_name, tool_input, tool_output,
             files_created, files_modified, files_read, files_deleted,
             success, prompt_number, created_at
      FROM tool_executions
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getAllRecentAiResponses(e=100){return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, prompt_number,
             response_text, response_type, tool_name, tool_input, tool_output,
             created_at, created_at_epoch
      FROM ai_responses
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}validateKeywords(e){let s=/^[a-zA-Z0-9\s\-_\.@:,]+$/;return e.filter(t=>{if(!t||t.trim().length===0)return!1;if(t.length>100)return d.warn("FTS5","Keyword too long, skipping",{length:t.length}),!1;if(!s.test(t))return d.warn("FTS5","Invalid characters in keyword, skipping",{keyword:t}),!1;let n=[/\bor\b/i,/\bnot\b/i,/NEAR\(/i,/\*/];for(let o of n)if(o.test(t))return d.warn("FTS5","Dangerous operator in keyword, skipping",{keyword:t}),!1;return!0}).map(t=>t.trim())}buildFTS5Query(e,s){let t=this.validateKeywords(e);if(t.length===0)throw new Error("No valid keywords after validation");return t.map(n=>`"${n.replace(/"/g,'""')}"`).join(` ${s} `)}getAiResponsesWithKeywords(e=[],s="AND",t,n=0,o=20){if(e.length===0){let f=this.getAllRecentAiResponses(o+n+1),m=t?f.filter(N=>N.project===t):f;return{items:m.slice(n,n+o),total:m.length,hasMore:m.length>n+o}}let a;try{a=this.buildFTS5Query(e,s)}catch(f){return d.error("FTS5","Failed to build search query",{keywords:e},f),{items:[],total:0,hasMore:!1}}let p=`
      SELECT ar.id, ar.claude_session_id, ar.sdk_session_id, ar.project, ar.prompt_number,
             ar.response_text, ar.response_type, ar.tool_name, ar.tool_input, ar.tool_output,
             ar.created_at, ar.created_at_epoch,
             bm25(ai_responses_fts) as rank
      FROM ai_responses ar
      JOIN ai_responses_fts ON ar.id = ai_responses_fts.rowid
      WHERE ai_responses_fts MATCH ?
    `,u=`
      SELECT COUNT(*) as total
      FROM ai_responses ar
      JOIN ai_responses_fts ON ar.id = ai_responses_fts.rowid
      WHERE ai_responses_fts MATCH ?
    `,l=[a];t&&(p+=" AND ar.project = ?",u+=" AND ar.project = ?",l.push(t)),p+=" ORDER BY rank, ar.created_at_epoch DESC LIMIT ? OFFSET ?",l.push(o+1,n);let E=this.db.prepare(p).all(...l),T=this.db.prepare(u).get(a,...t?[t]:[]),R=E.length>o;return{items:R?E.slice(0,o):E,total:T.total,hasMore:R}}getAllRecentToolExecutions(e=100){return this.db.prepare(`
      SELECT id, ai_response_id, claude_session_id, sdk_session_id, project,
             prompt_number, tool_name, tool_input, tool_output, tool_duration_ms,
             files_created, files_modified, files_read, files_deleted,
             error_message, success, created_at, created_at_epoch
      FROM tool_executions
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}createUserPromptsTable(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(10))return;if(this.db.query("PRAGMA table_info(user_prompts)").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString());return}d.info("DB"," Creating user_prompts table with FTS5 support..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
          CREATE TABLE user_prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claude_session_id TEXT NOT NULL,
            prompt_number INTEGER NOT NULL,
            prompt_text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY(claude_session_id) REFERENCES sdk_sessions(claude_session_id) ON DELETE CASCADE
          );

          CREATE INDEX idx_user_prompts_claude_session ON user_prompts(claude_session_id);
          CREATE INDEX idx_user_prompts_created ON user_prompts(created_at_epoch DESC);
          CREATE INDEX idx_user_prompts_prompt_number ON user_prompts(prompt_number);
          CREATE INDEX idx_user_prompts_lookup ON user_prompts(claude_session_id, prompt_number);
        `),this.db.run(`
          CREATE VIRTUAL TABLE user_prompts_fts USING fts5(
            prompt_text,
            content='user_prompts',
            content_rowid='id'
          );
        `),this.db.run(`
          CREATE TRIGGER user_prompts_ai AFTER INSERT ON user_prompts BEGIN
            INSERT INTO user_prompts_fts(rowid, prompt_text)
            VALUES (new.id, new.prompt_text);
          END;

          CREATE TRIGGER user_prompts_ad AFTER DELETE ON user_prompts BEGIN
            INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
            VALUES('delete', old.id, old.prompt_text);
          END;

          CREATE TRIGGER user_prompts_au AFTER UPDATE ON user_prompts BEGIN
            INSERT INTO user_prompts_fts(user_prompts_fts, rowid, prompt_text)
            VALUES('delete', old.id, old.prompt_text);
            INSERT INTO user_prompts_fts(rowid, prompt_text)
            VALUES (new.id, new.prompt_text);
          END;
        `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(10,new Date().toISOString()),d.info("DB"," Successfully created user_prompts table with FTS5 support")}catch(t){throw this.db.run("ROLLBACK"),t}}catch(e){d.error("DB"," Migration error (create user_prompts table):",e.message)}}ensureDiscoveryTokensColumn(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(11))return;this.db.query("PRAGMA table_info(observations)").all().some(a=>a.name==="discovery_tokens")||(this.db.run("ALTER TABLE observations ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),d.info("DB"," Added discovery_tokens column to observations table")),this.db.query("PRAGMA table_info(session_summaries)").all().some(a=>a.name==="discovery_tokens")||(this.db.run("ALTER TABLE session_summaries ADD COLUMN discovery_tokens INTEGER DEFAULT 0"),d.info("DB"," Added discovery_tokens column to session_summaries table")),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(11,new Date().toISOString())}catch(e){throw d.error("DB"," Discovery tokens migration error:",e.message),e}}createPendingMessagesTable(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(16))return;if(this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_messages'").all().length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString());return}d.info("DB"," Creating pending_messages table..."),this.db.run(`
        CREATE TABLE pending_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_db_id INTEGER NOT NULL,
          claude_session_id TEXT NOT NULL,
          message_type TEXT NOT NULL CHECK(message_type IN ('observation', 'summarize')),
          tool_name TEXT,
          tool_input TEXT,
          tool_response TEXT,
          cwd TEXT,
          last_user_message TEXT,
          last_assistant_message TEXT,
          prompt_number INTEGER,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'processed', 'failed')),
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at_epoch INTEGER NOT NULL,
          started_processing_at_epoch INTEGER,
          completed_at_epoch INTEGER,
          FOREIGN KEY (session_db_id) REFERENCES sdk_sessions(id) ON DELETE CASCADE
        )
      `),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_session ON pending_messages(session_db_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_status ON pending_messages(status)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_pending_messages_claude_session ON pending_messages(claude_session_id)"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(16,new Date().toISOString()),d.info("DB"," pending_messages table created successfully")}catch(e){throw d.error("DB"," Pending messages table migration error:",e.message),e}}createAiResponsesAndToolExecutionsTables(){try{if(this.db.prepare("SELECT version FROM schema_versions WHERE version = ?").get(17))return;let s=this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_responses'").all(),t=this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='tool_executions'").all();if(s.length>0&&t.length>0){this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(17,new Date().toISOString());return}d.info("DB"," Creating ai_responses and tool_executions tables..."),this.db.run("BEGIN TRANSACTION");try{this.db.run(`
          CREATE TABLE IF NOT EXISTS ai_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claude_session_id TEXT NOT NULL,
            sdk_session_id TEXT,
            project TEXT NOT NULL,
            prompt_number INTEGER NOT NULL,
            response_text TEXT NOT NULL,
            response_type TEXT DEFAULT 'assistant' CHECK(response_type IN ('assistant', 'tool_result', 'error')),
            tool_name TEXT,
            tool_input TEXT,
            tool_output TEXT,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY (claude_session_id) REFERENCES sdk_sessions(claude_session_id) ON DELETE CASCADE
          )
        `),this.db.run(`
          CREATE TABLE IF NOT EXISTS tool_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ai_response_id INTEGER,
            claude_session_id TEXT NOT NULL,
            sdk_session_id TEXT,
            project TEXT NOT NULL,
            prompt_number INTEGER NOT NULL,
            tool_name TEXT NOT NULL,
            tool_input TEXT,
            tool_output TEXT,
            tool_duration_ms INTEGER,
            files_created TEXT,
            files_modified TEXT,
            files_read TEXT,
            files_deleted TEXT,
            error_message TEXT,
            success BOOLEAN DEFAULT TRUE,
            created_at TEXT NOT NULL,
            created_at_epoch INTEGER NOT NULL,
            FOREIGN KEY (ai_response_id) REFERENCES ai_responses(id) ON DELETE CASCADE,
            FOREIGN KEY (claude_session_id) REFERENCES sdk_sessions(claude_session_id) ON DELETE CASCADE
          )
        `),this.db.run("CREATE INDEX IF NOT EXISTS idx_ai_responses_claude_session ON ai_responses(claude_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_ai_responses_sdk_session ON ai_responses(sdk_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_ai_responses_project ON ai_responses(project)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_ai_responses_prompt_number ON ai_responses(prompt_number)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_ai_responses_created ON ai_responses(created_at_epoch DESC)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_ai_response ON tool_executions(ai_response_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_claude_session ON tool_executions(claude_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_sdk_session ON tool_executions(sdk_session_id)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_project ON tool_executions(project)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_name ON tool_executions(tool_name)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_created ON tool_executions(created_at_epoch DESC)"),this.db.run("CREATE INDEX IF NOT EXISTS idx_tool_executions_success ON tool_executions(success)"),this.db.run(`
          CREATE VIRTUAL TABLE IF NOT EXISTS ai_responses_fts USING fts5(
            response_text,
            content='ai_responses',
            content_rowid='id'
          )
        `),this.db.run(`
          CREATE VIRTUAL TABLE IF NOT EXISTS tool_executions_fts USING fts5(
            tool_input,
            tool_output,
            error_message,
            content='tool_executions',
            content_rowid='id'
          )
        `),this.db.run(`
          CREATE TRIGGER IF NOT EXISTS ai_responses_ai AFTER INSERT ON ai_responses BEGIN
            INSERT INTO ai_responses_fts(rowid, response_text)
            VALUES (new.id, new.response_text);
          END;

          CREATE TRIGGER IF NOT EXISTS ai_responses_ad AFTER DELETE ON ai_responses BEGIN
            INSERT INTO ai_responses_fts(ai_responses_fts, rowid, response_text)
            VALUES('delete', old.id, old.response_text);
          END;

          CREATE TRIGGER IF NOT EXISTS ai_responses_au AFTER UPDATE ON ai_responses BEGIN
            INSERT INTO ai_responses_fts(ai_responses_fts, rowid, response_text)
            VALUES('delete', old.id, old.response_text);
            INSERT INTO ai_responses_fts(rowid, response_text)
            VALUES (new.id, new.response_text);
          END;
        `),this.db.run(`
          CREATE TRIGGER IF NOT EXISTS tool_executions_ai AFTER INSERT ON tool_executions BEGIN
            INSERT INTO tool_executions_fts(rowid, tool_input, tool_output, error_message)
            VALUES (new.id, new.tool_input, new.tool_output, new.error_message);
          END;

          CREATE TRIGGER IF NOT EXISTS tool_executions_ad AFTER DELETE ON tool_executions BEGIN
            INSERT INTO tool_executions_fts(tool_executions_fts, rowid, tool_input, tool_output, error_message)
            VALUES('delete', old.id, old.tool_input, old.tool_output, old.error_message);
          END;

          CREATE TRIGGER IF NOT EXISTS tool_executions_au AFTER UPDATE ON tool_executions BEGIN
            INSERT INTO tool_executions_fts(tool_executions_fts, rowid, tool_input, tool_output, error_message)
            VALUES('delete', old.id, old.tool_input, old.tool_output, old.error_message);
            INSERT INTO tool_executions_fts(rowid, tool_input, tool_output, error_message)
            VALUES (new.id, new.tool_input, new.tool_output, new.error_message);
          END;
        `),this.db.run("COMMIT"),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(17,new Date().toISOString()),d.info("DB"," ai_responses and tool_executions tables created successfully")}catch(n){throw this.db.run("ROLLBACK"),n}}catch(e){throw d.error("DB"," AI responses and tool executions migration error:",e.message),e}}getRecentSummaries(e,s=10){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getRecentSummariesWithSessionInfo(e,s=3){return this.db.prepare(`
      SELECT
        sdk_session_id, request, learned, completed, next_steps,
        prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getRecentObservations(e,s=20){return this.db.prepare(`
      SELECT type, text, prompt_number, created_at
      FROM observations
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,s)}getAllRecentObservations(e=100){return this.db.prepare(`
      SELECT id, type, title, subtitle, text, project, prompt_number, created_at, created_at_epoch
      FROM observations
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllRecentSummaries(e=50){return this.db.prepare(`
      SELECT id, request, investigated, learned, completed, next_steps,
             files_read, files_edited, notes, project, prompt_number,
             created_at, created_at_epoch
      FROM session_summaries
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllRecentUserPrompts(e=100){return this.db.prepare(`
      SELECT
        up.id,
        up.claude_session_id,
        s.project,
        up.prompt_number,
        up.prompt_text,
        up.created_at,
        up.created_at_epoch
      FROM user_prompts up
      LEFT JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      ORDER BY up.created_at_epoch DESC
      LIMIT ?
    `).all(e)}getAllProjects(){return this.db.prepare(`
      SELECT DISTINCT project
      FROM sdk_sessions
      WHERE project IS NOT NULL AND project != ''
      ORDER BY project ASC
    `).all().map(t=>t.project)}getLatestUserPrompt(e){return this.db.prepare(`
      SELECT
        up.*,
        s.sdk_session_id,
        s.project
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.claude_session_id = ?
      ORDER BY up.created_at_epoch DESC
      LIMIT 1
    `).get(e)}getRecentSessionsWithStatus(e,s=3){return this.db.prepare(`
      SELECT * FROM (
        SELECT
          s.sdk_session_id,
          s.status,
          s.started_at,
          s.started_at_epoch,
          s.user_prompt,
          CASE WHEN sum.sdk_session_id IS NOT NULL THEN 1 ELSE 0 END as has_summary
        FROM sdk_sessions s
        LEFT JOIN session_summaries sum ON s.sdk_session_id = sum.sdk_session_id
        WHERE s.project = ? AND s.sdk_session_id IS NOT NULL
        GROUP BY s.sdk_session_id
        ORDER BY s.started_at_epoch DESC
        LIMIT ?
      )
      ORDER BY started_at_epoch ASC
    `).all(e,s)}getObservationsForSession(e){return this.db.prepare(`
      SELECT title, subtitle, type, prompt_number
      FROM observations
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch ASC
    `).all(e)}getObservationById(e){return this.db.prepare(`
      SELECT *
      FROM observations
      WHERE id = ?
    `).get(e)||null}getObservationsByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:n,project:o,type:a,concepts:p,files:u}=s,l=t==="date_asc"?"ASC":"DESC",E=n?`LIMIT ${n}`:"",T=e.map(()=>"?").join(","),R=[...e],h=[];if(o&&(h.push("project = ?"),R.push(o)),a)if(Array.isArray(a)){let r=a.map(()=>"?").join(",");h.push(`type IN (${r})`),R.push(...a)}else h.push("type = ?"),R.push(a);if(p){let r=Array.isArray(p)?p:[p],N=r.map(()=>"EXISTS (SELECT 1 FROM json_each(concepts) WHERE value = ?)");R.push(...r),h.push(`(${N.join(" OR ")})`)}if(u){let r=Array.isArray(u)?u:[u],N=r.map(()=>"(EXISTS (SELECT 1 FROM json_each(files_read) WHERE value LIKE ?) OR EXISTS (SELECT 1 FROM json_each(files_modified) WHERE value LIKE ?))");r.forEach(A=>{R.push(`%${A}%`,`%${A}%`)}),h.push(`(${N.join(" OR ")})`)}let f=h.length>0?`WHERE id IN (${T}) AND ${h.join(" AND ")}`:`WHERE id IN (${T})`;return this.db.prepare(`
      SELECT *
      FROM observations
      ${f}
      ORDER BY created_at_epoch ${l}
      ${E}
    `).all(...R)}getSummaryForSession(e){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch DESC
      LIMIT 1
    `).get(e)||null}getFilesForSession(e){let t=this.db.prepare(`
      SELECT files_read, files_modified
      FROM observations
      WHERE sdk_session_id = ?
    `).all(e),n=new Set,o=new Set;for(let a of t){if(a.files_read)try{let p=JSON.parse(a.files_read);Array.isArray(p)&&p.forEach(u=>n.add(u))}catch{}if(a.files_modified)try{let p=JSON.parse(a.files_modified);Array.isArray(p)&&p.forEach(u=>o.add(u))}catch{}}return{filesRead:Array.from(n),filesModified:Array.from(o)}}getSessionById(e){return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}getSdkSessionsBySessionIds(e){if(e.length===0)return[];let s=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt,
             started_at, started_at_epoch, completed_at, completed_at_epoch, status
      FROM sdk_sessions
      WHERE sdk_session_id IN (${s})
      ORDER BY started_at_epoch DESC
    `).all(...e)}findActiveSDKSession(e){return this.db.prepare(`
      SELECT id, sdk_session_id, project, worker_port
      FROM sdk_sessions
      WHERE claude_session_id = ? AND status = 'active'
      LIMIT 1
    `).get(e)||null}findAnySDKSession(e){return this.db.prepare(`
      SELECT id
      FROM sdk_sessions
      WHERE claude_session_id = ?
      LIMIT 1
    `).get(e)||null}reactivateSession(e,s){this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'active', user_prompt = ?, worker_port = NULL
      WHERE id = ?
    `).run(s,e)}incrementPromptCounter(e){return this.db.prepare(`
      UPDATE sdk_sessions
      SET prompt_counter = COALESCE(prompt_counter, 0) + 1
      WHERE id = ?
    `).run(e),this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||1}getPromptCounter(e){return this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||0}createSDKSession(e,s,t){let n=new Date,o=n.getTime();return this.db.prepare(`
      INSERT INTO sdk_sessions
      (claude_session_id, sdk_session_id, project, user_prompt, started_at, started_at_epoch, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
      ON CONFLICT(claude_session_id) DO UPDATE SET
        project = COALESCE(NULLIF(?, ''), project),
        user_prompt = COALESCE(NULLIF(?, ''), user_prompt)
      WHERE claude_session_id = ?
    `).run(e,e,s,t,n.toISOString(),o,s,t,e),this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE claude_session_id = ? LIMIT 1
    `).get(e).id}updateSDKSessionId(e,s){return this.db.prepare(`
      UPDATE sdk_sessions
      SET sdk_session_id = ?
      WHERE id = ? AND sdk_session_id IS NULL
    `).run(s,e).changes===0?(d.debug("DB","sdk_session_id already set, skipping update",{sessionId:e,sdkSessionId:s}),!1):!0}setWorkerPort(e,s){this.db.prepare(`
      UPDATE sdk_sessions
      SET worker_port = ?
      WHERE id = ?
    `).run(s,e)}getWorkerPort(e){return this.db.prepare(`
      SELECT worker_port
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)?.worker_port||null}saveUserPrompt(e,s,t){let n=new Date,o=n.getTime();return this.db.prepare(`
      INSERT INTO user_prompts
      (claude_session_id, prompt_number, prompt_text, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?)
    `).run(e,s,t,n.toISOString(),o).lastInsertRowid}getUserPrompt(e,s){return this.db.prepare(`
      SELECT prompt_text
      FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
      LIMIT 1
    `).get(e,s)?.prompt_text??null}storeObservation(e,s,t,n,o=0){let a=new Date,p=a.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,s,a.toISOString(),p),d.info("DB",`Auto-created session record for session_id: ${e}`));let T=this.db.prepare(`
      INSERT INTO observations
      (sdk_session_id, project, type, title, subtitle, facts, narrative, concepts,
       files_read, files_modified, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,s,t.type,t.title,t.subtitle,JSON.stringify(t.facts),t.narrative,JSON.stringify(t.concepts),JSON.stringify(t.files_read),JSON.stringify(t.files_modified),n||null,o,a.toISOString(),p);return{id:Number(T.lastInsertRowid),createdAtEpoch:p}}storeSummary(e,s,t,n,o=0){let a=new Date,p=a.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,s,a.toISOString(),p),d.info("DB",`Auto-created session record for session_id: ${e}`));let T=this.db.prepare(`
      INSERT INTO session_summaries
      (sdk_session_id, project, request, investigated, learned, completed,
       next_steps, notes, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,s,t.request,t.investigated,t.learned,t.completed,t.next_steps,t.notes,n||null,o,a.toISOString(),p);return{id:Number(T.lastInsertRowid),createdAtEpoch:p}}markSessionCompleted(e){let s=new Date,t=s.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'completed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(s.toISOString(),t,e)}markSessionFailed(e){let s=new Date,t=s.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'failed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(s.toISOString(),t,e)}getSessionSummariesByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:n,project:o}=s,a=t==="date_asc"?"ASC":"DESC",p=n?`LIMIT ${n}`:"",u=e.map(()=>"?").join(","),l=[...e],E=o?`WHERE id IN (${u}) AND project = ?`:`WHERE id IN (${u})`;return o&&l.push(o),this.db.prepare(`
      SELECT * FROM session_summaries
      ${E}
      ORDER BY created_at_epoch ${a}
      ${p}
    `).all(...l)}getUserPromptsByIds(e,s={}){if(e.length===0)return[];let{orderBy:t="date_desc",limit:n,project:o}=s,a=t==="date_asc"?"ASC":"DESC",p=n?`LIMIT ${n}`:"",u=e.map(()=>"?").join(","),l=[...e],E=o?"AND s.project = ?":"";return o&&l.push(o),this.db.prepare(`
      SELECT
        up.*,
        s.project,
        s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.id IN (${u}) ${E}
      ORDER BY up.created_at_epoch ${a}
      ${p}
    `).all(...l)}getTimelineAroundTimestamp(e,s=10,t=10,n){return this.getTimelineAroundObservation(null,e,s,t,n)}getTimelineAroundObservation(e,s,t=10,n=10,o){let a=o?"AND project = ?":"",p=o?[o]:[],u,l;if(e!==null){let h=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id <= ? ${a}
        ORDER BY id DESC
        LIMIT ?
      `,f=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id >= ? ${a}
        ORDER BY id ASC
        LIMIT ?
      `;try{let m=this.db.prepare(h).all(e,...p,t+1),r=this.db.prepare(f).all(e,...p,n+1);if(m.length===0&&r.length===0)return{observations:[],sessions:[],prompts:[]};u=m.length>0?m[m.length-1].created_at_epoch:s,l=r.length>0?r[r.length-1].created_at_epoch:s}catch(m){return d.error("DB"," Error getting boundary observations:",m.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}else{let h=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch <= ? ${a}
        ORDER BY created_at_epoch DESC
        LIMIT ?
      `,f=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch >= ? ${a}
        ORDER BY created_at_epoch ASC
        LIMIT ?
      `;try{let m=this.db.prepare(h).all(s,...p,t),r=this.db.prepare(f).all(s,...p,n+1);if(m.length===0&&r.length===0)return{observations:[],sessions:[],prompts:[]};u=m.length>0?m[m.length-1].created_at_epoch:s,l=r.length>0?r[r.length-1].created_at_epoch:s}catch(m){return d.error("DB"," Error getting boundary timestamps:",m.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}let E=`
      SELECT *
      FROM observations
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${a}
      ORDER BY created_at_epoch ASC
    `,T=`
      SELECT *
      FROM session_summaries
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${a}
      ORDER BY created_at_epoch ASC
    `,R=`
      SELECT up.*, s.project, s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.created_at_epoch >= ? AND up.created_at_epoch <= ? ${a.replace("project","s.project")}
      ORDER BY up.created_at_epoch ASC
    `;try{let h=this.db.prepare(E).all(u,l,...p),f=this.db.prepare(T).all(u,l,...p),m=this.db.prepare(R).all(u,l,...p);return{observations:h,sessions:f.map(r=>({id:r.id,sdk_session_id:r.sdk_session_id,project:r.project,request:r.request,completed:r.completed,next_steps:r.next_steps,created_at:r.created_at,created_at_epoch:r.created_at_epoch})),prompts:m.map(r=>({id:r.id,claude_session_id:r.claude_session_id,prompt_number:r.prompt_number,prompt_text:r.prompt_text,project:r.project,created_at:r.created_at,created_at_epoch:r.created_at_epoch}))}}catch(h){return d.error("DB"," Error querying timeline records:",h.message,o?`(project: ${o})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}getPromptById(e){return this.db.prepare(`
      SELECT
        p.id,
        p.claude_session_id,
        p.prompt_number,
        p.prompt_text,
        s.project,
        p.created_at,
        p.created_at_epoch
      FROM user_prompts p
      LEFT JOIN sdk_sessions s ON p.claude_session_id = s.claude_session_id
      WHERE p.id = ?
      LIMIT 1
    `).get(e)||null}getPromptsByIds(e){if(e.length===0)return[];let s=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT
        p.id,
        p.claude_session_id,
        p.prompt_number,
        p.prompt_text,
        s.project,
        p.created_at,
        p.created_at_epoch
      FROM user_prompts p
      LEFT JOIN sdk_sessions s ON p.claude_session_id = s.claude_session_id
      WHERE p.id IN (${s})
      ORDER BY p.created_at_epoch DESC
    `).all(...e)}getSessionSummaryById(e){return this.db.prepare(`
      SELECT
        id,
        sdk_session_id,
        claude_session_id,
        project,
        user_prompt,
        request_summary,
        learned_summary,
        status,
        created_at,
        created_at_epoch
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}close(){this.db.close()}importSdkSession(e){let s=this.db.prepare("SELECT id FROM sdk_sessions WHERE claude_session_id = ?").get(e.claude_session_id);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO sdk_sessions (
        claude_session_id, sdk_session_id, project, user_prompt,
        started_at, started_at_epoch, completed_at, completed_at_epoch, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.sdk_session_id,e.project,e.user_prompt,e.started_at,e.started_at_epoch,e.completed_at,e.completed_at_epoch,e.status).lastInsertRowid}}importSessionSummary(e){let s=this.db.prepare("SELECT id FROM session_summaries WHERE sdk_session_id = ?").get(e.sdk_session_id);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO session_summaries (
        sdk_session_id, project, request, investigated, learned,
        completed, next_steps, files_read, files_edited, notes,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.request,e.investigated,e.learned,e.completed,e.next_steps,e.files_read,e.files_edited,e.notes,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importObservation(e){let s=this.db.prepare(`
      SELECT id FROM observations
      WHERE sdk_session_id = ? AND title = ? AND created_at_epoch = ?
    `).get(e.sdk_session_id,e.title,e.created_at_epoch);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO observations (
        sdk_session_id, project, text, type, title, subtitle,
        facts, narrative, concepts, files_read, files_modified,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.text,e.type,e.title,e.subtitle,e.facts,e.narrative,e.concepts,e.files_read,e.files_modified,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importUserPrompt(e){let s=this.db.prepare(`
      SELECT id FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
    `).get(e.claude_session_id,e.prompt_number);return s?{imported:!1,id:s.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO user_prompts (
        claude_session_id, prompt_number, prompt_text,
        created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.prompt_number,e.prompt_text,e.created_at,e.created_at_epoch).lastInsertRowid}}};var ae=se(require("path"),1);function de(_){if(!_)return[];try{let e=JSON.parse(_);return Array.isArray(e)?e:[]}catch{return[]}}function Le(_){return new Date(_).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:!0})}function Ce(_){return new Date(_).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}function De(_){return new Date(_).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Ke(_,e){return ae.default.isAbsolute(_)?ae.default.relative(e,_):_}function ye(_,e){let s=de(_);return s.length>0?Ke(s[0],e):"General"}var ve=se(require("path"),1);function Me(_){if(!_||_.trim()==="")return d.warn("PROJECT_NAME","Empty cwd provided, using fallback",{cwd:_}),"unknown-project";let e=ve.default.basename(_);if(e===""){if(process.platform==="win32"){let t=_.match(/^([A-Z]):\\/i);if(t){let o=`drive-${t[1].toUpperCase()}`;return d.info("PROJECT_NAME","Drive root detected",{cwd:_,projectName:o}),o}}return d.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:_}),"unknown-project"}return e}var qe=J.default.join((0,Q.homedir)(),".claude","plugins","marketplaces","chengjon","plugin",".install-version");function Je(){let _=J.default.join((0,Q.homedir)(),".claude-mem","settings.json"),e=k.loadFromFile(_);try{return{totalObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_OBSERVATIONS,10),fullObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_FULL_COUNT,10),sessionCount:parseInt(e.CLAUDE_MEM_CONTEXT_SESSION_COUNT,10),showReadTokens:e.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS==="true",showWorkTokens:e.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS==="true",showSavingsAmount:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT==="true",showSavingsPercent:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT==="true",observationTypes:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES.split(",").map(s=>s.trim()).filter(Boolean)),observationConcepts:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS.split(",").map(s=>s.trim()).filter(Boolean)),fullObservationField:e.CLAUDE_MEM_CONTEXT_FULL_FIELD,showLastSummary:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY==="true",showLastMessage:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE==="true"}}catch(s){return d.warn("WORKER","Failed to load context settings, using defaults",{},s),{totalObservationCount:50,fullObservationCount:5,sessionCount:10,showReadTokens:!0,showWorkTokens:!0,showSavingsAmount:!0,showSavingsPercent:!0,observationTypes:new Set(te),observationConcepts:new Set(re),fullObservationField:"narrative",showLastSummary:!0,showLastMessage:!1}}}var ke=4,Qe=1,i={reset:"\x1B[0m",bright:"\x1B[1m",dim:"\x1B[2m",cyan:"\x1B[36m",green:"\x1B[32m",yellow:"\x1B[33m",blue:"\x1B[34m",magenta:"\x1B[35m",gray:"\x1B[90m",red:"\x1B[31m"};function q(_,e,s,t){return e?t?[`${s}${_}:${i.reset} ${e}`,""]:[`**${_}**: ${e}`,""]:[]}function ze(_){return _.replace(/\//g,"-")}function Ze(_){try{if(!(0,P.existsSync)(_))return{userMessage:"",assistantMessage:""};let e=(0,P.readFileSync)(_,"utf-8").trim();if(!e)return{userMessage:"",assistantMessage:""};let s=e.split(`
`).filter(n=>n.trim()),t="";for(let n=s.length-1;n>=0;n--)try{let o=s[n];if(!o.includes('"type":"assistant"'))continue;let a=JSON.parse(o);if(a.type==="assistant"&&a.message?.content&&Array.isArray(a.message.content)){let p="";for(let u of a.message.content)u.type==="text"&&(p+=u.text);if(p=p.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g,"").trim(),p){t=p;break}}}catch{continue}return{userMessage:"",assistantMessage:t}}catch(e){return d.failure("WORKER","Failed to extract prior messages from transcript",{transcriptPath:_},e),{userMessage:"",assistantMessage:""}}}async function es(_,e=!1){let s=Je(),t=_?.cwd??process.cwd(),n=Me(t),o=null;try{o=new K}catch(N){if(N.code==="ERR_DLOPEN_FAILED"){try{(0,P.unlinkSync)(qe)}catch{}return d.error("Native module rebuild needed - restart Claude Code to auto-fix"),""}throw N}let a=Array.from(s.observationTypes),p=a.map(()=>"?").join(","),u=Array.from(s.observationConcepts),l=u.map(()=>"?").join(","),E=o.db.prepare(`
    SELECT
      id, sdk_session_id, type, title, subtitle, narrative,
      facts, concepts, files_read, files_modified, discovery_tokens,
      created_at, created_at_epoch
    FROM observations
    WHERE project = ?
      AND type IN (${p})
      AND EXISTS (
        SELECT 1 FROM json_each(concepts)
        WHERE value IN (${l})
      )
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(n,...a,...u,s.totalObservationCount),T=o.db.prepare(`
    SELECT id, sdk_session_id, request, investigated, learned, completed, next_steps, created_at, created_at_epoch
    FROM session_summaries
    WHERE project = ?
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(n,s.sessionCount+Qe),R="",h="";if(s.showLastMessage&&E.length>0)try{let N=_?.session_id,A=E.find(O=>O.sdk_session_id!==N);if(A){let O=A.sdk_session_id,y=ze(t),w=J.default.join((0,Q.homedir)(),".claude","projects",y,`${O}.jsonl`),j=Ze(w);R=j.userMessage,h=j.assistantMessage}}catch{}if(E.length===0&&T.length===0)return o?.close(),e?`
${i.bright}${i.cyan}[${n}] recent context${i.reset}
${i.gray}${"\u2500".repeat(60)}${i.reset}

${i.dim}No previous sessions found for this project yet.${i.reset}
`:`# [${n}] recent context

No previous sessions found for this project yet.`;let f=T.slice(0,s.sessionCount),m=E,r=[];if(e?(r.push(""),r.push(`${i.bright}${i.cyan}[${n}] recent context${i.reset}`),r.push(`${i.gray}${"\u2500".repeat(60)}${i.reset}`),r.push("")):(r.push(`# [${n}] recent context`),r.push("")),m.length>0){e?r.push(`${i.dim}Legend: \u{1F3AF} session-request | \u{1F534} bugfix | \u{1F7E3} feature | \u{1F504} refactor | \u2705 change | \u{1F535} discovery | \u2696\uFE0F  decision${i.reset}`):r.push("**Legend:** \u{1F3AF} session-request | \u{1F534} bugfix | \u{1F7E3} feature | \u{1F504} refactor | \u2705 change | \u{1F535} discovery | \u2696\uFE0F  decision"),r.push(""),e?(r.push(`${i.bright}\u{1F4A1} Column Key${i.reset}`),r.push(`${i.dim}  Read: Tokens to read this observation (cost to learn it now)${i.reset}`),r.push(`${i.dim}  Work: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)${i.reset}`)):(r.push("\u{1F4A1} **Column Key**:"),r.push("- **Read**: Tokens to read this observation (cost to learn it now)"),r.push("- **Work**: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)")),r.push(""),e?(r.push(`${i.dim}\u{1F4A1} Context Index: This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.${i.reset}`),r.push(""),r.push(`${i.dim}When you need implementation details, rationale, or debugging context:${i.reset}`),r.push(`${i.dim}  - Use the mem-search skill to fetch full observations on-demand${i.reset}`),r.push(`${i.dim}  - Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching${i.reset}`),r.push(`${i.dim}  - Trust this index over re-reading code for past decisions and learnings${i.reset}`)):(r.push("\u{1F4A1} **Context Index:** This semantic index (titles, types, files, tokens) is usually sufficient to understand past work."),r.push(""),r.push("When you need implementation details, rationale, or debugging context:"),r.push("- Use the mem-search skill to fetch full observations on-demand"),r.push("- Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching"),r.push("- Trust this index over re-reading code for past decisions and learnings")),r.push("");let N=E.length,A=E.reduce((c,S)=>{let b=(S.title?.length||0)+(S.subtitle?.length||0)+(S.narrative?.length||0)+JSON.stringify(S.facts||[]).length;return c+Math.ceil(b/ke)},0),O=E.reduce((c,S)=>c+(S.discovery_tokens||0),0),y=O-A,w=O>0?Math.round(y/O*100):0,j=s.showReadTokens||s.showWorkTokens||s.showSavingsAmount||s.showSavingsPercent;if(j)if(e){if(r.push(`${i.bright}${i.cyan}\u{1F4CA} Context Economics${i.reset}`),r.push(`${i.dim}  Loading: ${N} observations (${A.toLocaleString()} tokens to read)${i.reset}`),r.push(`${i.dim}  Work investment: ${O.toLocaleString()} tokens spent on research, building, and decisions${i.reset}`),O>0&&(s.showSavingsAmount||s.showSavingsPercent)){let c="  Your savings: ";s.showSavingsAmount&&s.showSavingsPercent?c+=`${y.toLocaleString()} tokens (${w}% reduction from reuse)`:s.showSavingsAmount?c+=`${y.toLocaleString()} tokens`:c+=`${w}% reduction from reuse`,r.push(`${i.green}${c}${i.reset}`)}r.push("")}else{if(r.push("\u{1F4CA} **Context Economics**:"),r.push(`- Loading: ${N} observations (${A.toLocaleString()} tokens to read)`),r.push(`- Work investment: ${O.toLocaleString()} tokens spent on research, building, and decisions`),O>0&&(s.showSavingsAmount||s.showSavingsPercent)){let c="- Your savings: ";s.showSavingsAmount&&s.showSavingsPercent?c+=`${y.toLocaleString()} tokens (${w}% reduction from reuse)`:s.showSavingsAmount?c+=`${y.toLocaleString()} tokens`:c+=`${w}% reduction from reuse`,r.push(c)}r.push("")}let xe=T[0]?.id,Ue=f.map((c,S)=>{let b=S===0?null:T[S+1];return{...c,displayEpoch:b?b.created_at_epoch:c.created_at_epoch,displayTime:b?b.created_at:c.created_at,shouldShowLink:c.id!==xe}}),$e=new Set(E.slice(0,s.fullObservationCount).map(c=>c.id)),_e=[...m.map(c=>({type:"observation",data:c})),...Ue.map(c=>({type:"summary",data:c}))];_e.sort((c,S)=>{let b=c.type==="observation"?c.data.created_at_epoch:c.data.displayEpoch,v=S.type==="observation"?S.data.created_at_epoch:S.data.displayEpoch;return b-v});let G=new Map;for(let c of _e){let S=c.type==="observation"?c.data.created_at:c.data.displayTime,b=De(S);G.has(b)||G.set(b,[]),G.get(b).push(c)}let we=Array.from(G.entries()).sort((c,S)=>{let b=new Date(c[0]).getTime(),v=new Date(S[0]).getTime();return b-v});for(let[c,S]of we){e?(r.push(`${i.bright}${i.cyan}${c}${i.reset}`),r.push("")):(r.push(`### ${c}`),r.push(""));let b=null,v="",x=!1;for(let z of S)if(z.type==="summary"){x&&(r.push(""),x=!1,b=null,v="");let g=z.data,U=`${g.request||"Session started"} (${Le(g.displayTime)})`;e?r.push(`\u{1F3AF} ${i.yellow}#S${g.id}${i.reset} ${U}`):r.push(`**\u{1F3AF} #S${g.id}** ${U}`),r.push("")}else{let g=z.data,U=ye(g.files_modified,t);U!==b&&(x&&r.push(""),e?r.push(`${i.dim}${U}${i.reset}`):r.push(`**${U}**`),e||(r.push("| ID | Time | T | Title | Read | Work |"),r.push("|----|------|---|-------|------|------|")),b=U,x=!0,v="");let $=Ce(g.created_at),W=g.title||"Untitled",H=me[g.type]||"\u2022",Fe=(g.title?.length||0)+(g.subtitle?.length||0)+(g.narrative?.length||0)+JSON.stringify(g.facts||[]).length,F=Math.ceil(Fe/ke),X=g.discovery_tokens||0,Z=Te[g.type]||"\u{1F50D}",ue=X>0?`${Z} ${X.toLocaleString()}`:"-",ee=$!==v,ce=ee?$:"";if(v=$,$e.has(g.id)){let M=s.fullObservationField==="narrative"?g.narrative:g.facts?de(g.facts).join(`
`):null;if(e){let C=ee?`${i.dim}${$}${i.reset}`:" ".repeat($.length),V=s.showReadTokens&&F>0?`${i.dim}(~${F}t)${i.reset}`:"",le=s.showWorkTokens&&X>0?`${i.dim}(${Z} ${X.toLocaleString()}t)${i.reset}`:"";r.push(`  ${i.dim}#${g.id}${i.reset}  ${C}  ${H}  ${i.bright}${W}${i.reset}`),M&&r.push(`    ${i.dim}${M}${i.reset}`),(V||le)&&r.push(`    ${V} ${le}`),r.push("")}else{x&&(r.push(""),x=!1),r.push(`**#${g.id}** ${ce||"\u2033"} ${H} **${W}**`),M&&(r.push(""),r.push(M),r.push(""));let C=[];s.showReadTokens&&C.push(`Read: ~${F}`),s.showWorkTokens&&C.push(`Work: ${ue}`),C.length>0&&r.push(C.join(", ")),r.push(""),b=null}}else if(e){let M=ee?`${i.dim}${$}${i.reset}`:" ".repeat($.length),C=s.showReadTokens&&F>0?`${i.dim}(~${F}t)${i.reset}`:"",V=s.showWorkTokens&&X>0?`${i.dim}(${Z} ${X.toLocaleString()}t)${i.reset}`:"";r.push(`  ${i.dim}#${g.id}${i.reset}  ${M}  ${H}  ${W} ${C} ${V}`)}else{let M=s.showReadTokens?`~${F}`:"",C=s.showWorkTokens?ue:"";r.push(`| #${g.id} | ${ce||"\u2033"} | ${H} | ${W} | ${M} | ${C} |`)}}x&&r.push("")}let L=T[0],pe=E[0];if(s.showLastSummary&&L&&(L.investigated||L.learned||L.completed||L.next_steps)&&(!pe||L.created_at_epoch>pe.created_at_epoch)&&(r.push(...q("Investigated",L.investigated,i.blue,e)),r.push(...q("Learned",L.learned,i.yellow,e)),r.push(...q("Completed",L.completed,i.green,e)),r.push(...q("Next Steps",L.next_steps,i.magenta,e))),h&&(r.push(""),r.push("---"),r.push(""),e?(r.push(`${i.bright}${i.magenta}\u{1F4CB} Previously${i.reset}`),r.push(""),r.push(`${i.dim}A: ${h}${i.reset}`)):(r.push("**\u{1F4CB} Previously**"),r.push(""),r.push(`A: ${h}`)),r.push("")),j&&O>0&&y>0){let c=Math.round(O/1e3);r.push(""),e?r.push(`${i.dim}\u{1F4B0} Access ${c}k tokens of past research & decisions for just ${A.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.${i.reset}`):r.push(`\u{1F4B0} Access ${c}k tokens of past research & decisions for just ${A.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.`)}}return o?.close(),r.join(`
`).trimEnd()}0&&(module.exports={generateContext});
