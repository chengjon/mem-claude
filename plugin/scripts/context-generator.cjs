"use strict";var Be=Object.create;var K=Object.defineProperty;var Pe=Object.getOwnPropertyDescriptor;var je=Object.getOwnPropertyNames;var We=Object.getPrototypeOf,He=Object.prototype.hasOwnProperty;var Ge=(_,e)=>{for(var t in e)K(_,t,{get:e[t],enumerable:!0})},Ee=(_,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of je(e))!He.call(_,n)&&n!==t&&K(_,n,{get:()=>e[n],enumerable:!(s=Pe(e,n))||s.enumerable});return _};var se=(_,e,t)=>(t=_!=null?Be(We(_)):{},Ee(e||!_||!_.__esModule?K(t,"default",{value:_,enumerable:!0}):t,_)),Ye=_=>Ee(K({},"__esModule",{value:!0}),_);var st={};Ge(st,{generateContext:()=>tt});module.exports=Ye(st);var Q=se(require("path"),1),z=require("os"),P=require("fs");var Ce=require("bun:sqlite");var A=require("path"),Ne=require("os"),be=require("fs");var Oe=require("url");var B=require("fs"),Re=require("path"),Se=require("os");var re=["bugfix","feature","refactor","discovery","decision","change"],ne=["how-it-works","why-it-exists","what-changed","problem-solution","gotcha","pattern","trade-off"],ge={bugfix:"\u{1F534}",feature:"\u{1F7E3}",refactor:"\u{1F504}",change:"\u2705",discovery:"\u{1F535}",decision:"\u2696\uFE0F","session-request":"\u{1F3AF}"},Te={discovery:"\u{1F50D}",change:"\u{1F6E0}\uFE0F",feature:"\u{1F6E0}\uFE0F",bugfix:"\u{1F6E0}\uFE0F",refactor:"\u{1F6E0}\uFE0F",decision:"\u2696\uFE0F"},fe=re.join(","),he=ne.join(",");var ie=(i=>(i[i.DEBUG=0]="DEBUG",i[i.INFO=1]="INFO",i[i.WARN=2]="WARN",i[i.ERROR=3]="ERROR",i[i.SILENT=4]="SILENT",i))(ie||{}),oe=class{level=null;useColor;constructor(){this.useColor=process.stdout.isTTY??!1}getLevel(){if(this.level===null){let e=M.get("CLAUDE_MEM_LOG_LEVEL").toUpperCase();this.level=ie[e]??1}return this.level}correlationId(e,t){return`obs-${e}-${t}`}sessionId(e){return`session-${e}`}formatData(e){if(e==null)return"";if(typeof e=="string")return e;if(typeof e=="number"||typeof e=="boolean")return e.toString();if(typeof e=="object"){if(e instanceof Error)return this.getLevel()===0?`${e.message}
${e.stack}`:e.message;if(Array.isArray(e))return`[${e.length} items]`;let t=Object.keys(e);return t.length===0?"{}":t.length<=3?JSON.stringify(e):`{${t.length} keys: ${t.slice(0,3).join(", ")}...}`}return String(e)}formatTool(e,t){if(!t)return e;try{let s=typeof t=="string"?JSON.parse(t):t;if(e==="Bash"&&s.command)return`${e}(${s.command})`;if(s.file_path)return`${e}(${s.file_path})`;if(s.notebook_path)return`${e}(${s.notebook_path})`;if(e==="Glob"&&s.pattern)return`${e}(${s.pattern})`;if(e==="Grep"&&s.pattern)return`${e}(${s.pattern})`;if(s.url)return`${e}(${s.url})`;if(s.query)return`${e}(${s.query})`;if(e==="Task"){if(s.subagent_type)return`${e}(${s.subagent_type})`;if(s.description)return`${e}(${s.description})`}return e==="Skill"&&s.skill?`${e}(${s.skill})`:e==="LSP"&&s.operation?`${e}(${s.operation})`:e}catch{return e}}formatTimestamp(e){let t=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0"),i=String(e.getHours()).padStart(2,"0"),d=String(e.getMinutes()).padStart(2,"0"),c=String(e.getSeconds()).padStart(2,"0"),p=String(e.getMilliseconds()).padStart(3,"0");return`${t}-${s}-${n} ${i}:${d}:${c}.${p}`}log(e,t,s,n,i){if(e<this.getLevel())return;let d=this.formatTimestamp(new Date),c=ie[e].padEnd(5),p=t.padEnd(6),l="";n?.correlationId?l=`[${n.correlationId}] `:n?.sessionId&&(l=`[session-${n.sessionId}] `);let m="";i!=null&&(this.getLevel()===0&&typeof i=="object"?m=`
`+JSON.stringify(i,null,2):m=" "+this.formatData(i));let g="";if(n){let{sessionId:f,sdkSessionId:N,correlationId:E,...r}=n;Object.keys(r).length>0&&(g=` {${Object.entries(r).map(([L,O])=>`${L}=${O}`).join(", ")}}`)}let S=`[${d}] [${c}] [${p}] ${l}${s}${g}${m}`;e===3?console.error(S):console.log(S)}debug(e,t,s,n){this.log(0,e,t,s,n)}info(e,t,s,n){this.log(1,e,t,s,n)}warn(e,t,s,n){this.log(2,e,t,s,n)}error(e,t,s,n){this.log(3,e,t,s,n)}dataIn(e,t,s,n){this.info(e,`\u2192 ${t}`,s,n)}dataOut(e,t,s,n){this.info(e,`\u2190 ${t}`,s,n)}success(e,t,s,n){this.info(e,`\u2713 ${t}`,s,n)}failure(e,t,s,n){this.error(e,`\u2717 ${t}`,s,n)}timing(e,t,s,n){this.info(e,`\u23F1 ${t}`,n,{duration:`${s}ms`})}happyPathError(e,t,s,n,i=""){let l=((new Error().stack||"").split(`
`)[2]||"").match(/at\s+(?:.*\s+)?\(?([^:]+):(\d+):(\d+)\)?/),m=l?`${l[1].split("/").pop()}:${l[2]}`:"unknown",g={...s,location:m};return this.warn(e,`[HAPPY-PATH] ${t}`,g,n),i}},a=new oe;var M=class{static DEFAULTS={CLAUDE_MEM_MODEL:"claude-sonnet-4-5",CLAUDE_MEM_CONTEXT_OBSERVATIONS:"50",CLAUDE_MEM_WORKER_PORT:"37777",CLAUDE_MEM_WORKER_HOST:"127.0.0.1",CLAUDE_MEM_SKIP_TOOLS:"ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion",CLAUDE_MEM_DATA_DIR:(0,Re.join)((0,Se.homedir)(),".mem-claude"),CLAUDE_MEM_LOG_LEVEL:"INFO",CLAUDE_MEM_PYTHON_VERSION:"3.13",CLAUDE_CODE_PATH:"",CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT:"true",CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT:"true",CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES:fe,CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS:he,CLAUDE_MEM_CONTEXT_FULL_COUNT:"5",CLAUDE_MEM_CONTEXT_FULL_FIELD:"narrative",CLAUDE_MEM_CONTEXT_SESSION_COUNT:"10",CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY:"true",CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE:"false"};static getAllDefaults(){return{...this.DEFAULTS}}static get(e){return this.DEFAULTS[e]}static getInt(e){let t=this.get(e);return parseInt(t,10)}static getBool(e){return this.get(e)==="true"}static loadFromFile(e){try{if(!(0,B.existsSync)(e))return this.getAllDefaults();let t=(0,B.readFileSync)(e,"utf-8"),s=JSON.parse(t),n=s;if(s.env&&typeof s.env=="object"){n=s.env;try{(0,B.writeFileSync)(e,JSON.stringify(n,null,2),"utf-8"),a.info("SETTINGS","Migrated settings file from nested to flat schema",{settingsPath:e})}catch(d){a.warn("SETTINGS","Failed to auto-migrate settings file",{settingsPath:e},d)}}let i={...this.DEFAULTS};for(let d of Object.keys(this.DEFAULTS))n[d]!==void 0&&(i[d]=n[d]);return i}catch(t){return a.warn("SETTINGS","Failed to load settings, using defaults",{settingsPath:e},t),this.getAllDefaults()}}};var qe={};function Ke(){return typeof __dirname<"u"?__dirname:(0,A.dirname)((0,Oe.fileURLToPath)(qe.url))}var Et=Ke(),y=M.get("CLAUDE_MEM_DATA_DIR"),ae=process.env.CLAUDE_CONFIG_DIR||(0,A.join)((0,Ne.homedir)(),".claude"),gt=(0,A.join)(y,"archives"),Tt=(0,A.join)(y,"logs"),ft=(0,A.join)(y,"trash"),ht=(0,A.join)(y,"backups"),Rt=(0,A.join)(y,"settings.json"),Ae=(0,A.join)(y,"mem-claude.db"),St=(0,A.join)(y,"vector-db"),Nt=(0,A.join)(ae,"settings.json"),bt=(0,A.join)(ae,"commands"),Ot=(0,A.join)(ae,"CLAUDE.md");function Le(_){(0,be.mkdirSync)(_,{recursive:!0})}var q=class{constructor(e){this.db=e;this.registerMigrations()}migrations=new Map;registerMigrations(){this.migrations.set(5,{version:5,up:e=>this.migrateAddWorkerPortColumn(e)}),this.migrations.set(6,{version:6,up:e=>this.migrateAddPromptTrackingColumns(e)}),this.migrations.set(7,{version:7,up:e=>this.migrateRemoveSessionSummariesUniqueConstraint(e)}),this.migrations.set(8,{version:8,up:e=>this.migrateAddObservationHierarchicalFields(e)}),this.migrations.set(9,{version:9,up:e=>this.migrateMakeObservationsTextNullable(e)}),this.migrations.set(10,{version:10,up:e=>this.migrateCreateUserPromptsTable(e)}),this.migrations.set(11,{version:11,up:e=>this.migrateEnsureDiscoveryTokensColumn(e)}),this.migrations.set(12,{version:12,up:e=>this.migrateCreatePendingMessagesTable(e)}),this.migrations.set(13,{version:13,up:e=>this.migrateCreateAiResponsesAndToolExecutionsTables(e)}),this.migrations.set(14,{version:14,up:e=>this.migrateCreateConversationSummariesTable(e)}),this.migrations.set(15,{version:15,up:e=>this.migrateCreateContentTagsTable(e)}),this.migrations.set(16,{version:16,up:e=>this.migrateCreateConversationTagsTable(e)}),this.migrations.set(17,{version:17,up:e=>this.migrateCreateAnalysisTasksTable(e)})}runPendingMigrations(){let e=this.db.prepare("SELECT version FROM schema_versions ORDER BY version").all(),t=e.length>0?Math.max(...e.map(s=>s.version)):0;for(let[s,n]of this.migrations)if(s>t)try{a.info("DB",`Running migration ${s}...`),n.up(this.db),this.db.prepare("INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)").run(s,new Date().toISOString()),a.success("DB",`Migration ${s} applied successfully`)}catch(i){throw a.error("DB",`Migration ${s} failed`,{},i.message),i}}migrateAddWorkerPortColumn(e){e.query("PRAGMA table_info(sdk_sessions)").all().some(n=>n.name==="worker_port")||(e.run("ALTER TABLE sdk_sessions ADD COLUMN worker_port INTEGER"),a.info("DB","Added worker_port column to sdk_sessions table"))}migrateAddPromptTrackingColumns(e){e.query("PRAGMA table_info(sdk_sessions)").all().some(i=>i.name==="prompt_counter")||(e.run("ALTER TABLE sdk_sessions ADD COLUMN prompt_counter INTEGER DEFAULT 0"),a.info("DB","Added prompt_counter column to sdk_sessions table")),e.query("PRAGMA table_info(observations)").all().some(i=>i.name==="prompt_number")||(e.run("ALTER TABLE observations ADD COLUMN prompt_number INTEGER"),a.info("DB","Added prompt_number column to observations table")),e.query("PRAGMA table_info(session_summaries)").all().some(i=>i.name==="prompt_number")||(e.run("ALTER TABLE session_summaries ADD COLUMN prompt_number INTEGER"),a.info("DB","Added prompt_number column to session_summaries table"))}migrateRemoveSessionSummariesUniqueConstraint(e){if(e.query("PRAGMA index_list(session_summaries)").all().some(n=>n.unique===1)){a.info("DB","Removing UNIQUE constraint from session_summaries.sdk_session_id..."),e.run("BEGIN TRANSACTION");try{e.run(`
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
      `),e.run(`
        INSERT INTO session_summaries_new
        SELECT id, sdk_session_id, project, request, investigated, learned,
               completed, next_steps, files_read, files_edited, notes,
               prompt_number, created_at, created_at_epoch
        FROM session_summaries
      `),e.run("DROP TABLE session_summaries"),e.run("ALTER TABLE session_summaries_new RENAME TO session_summaries"),e.run(`
        CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
        CREATE INDEX idx_session_summaries_project ON session_summaries(project);
        CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
      `),e.run("COMMIT"),a.success("DB","Successfully removed UNIQUE constraint from session_summaries.sdk_session_id")}catch(n){throw e.run("ROLLBACK"),n}}}migrateAddObservationHierarchicalFields(e){e.query("PRAGMA table_info(observations)").all().some(s=>s.name==="title")||(a.info("DB","Adding hierarchical fields to observations table..."),e.run(`
      ALTER TABLE observations ADD COLUMN title TEXT;
      ALTER TABLE observations ADD COLUMN subtitle TEXT;
      ALTER TABLE observations ADD COLUMN facts TEXT;
      ALTER TABLE observations ADD COLUMN narrative TEXT;
      ALTER TABLE observations ADD COLUMN concepts TEXT;
      ALTER TABLE observations ADD COLUMN files_read TEXT;
      ALTER TABLE observations ADD COLUMN files_modified TEXT;
    `),a.info("DB","Successfully added hierarchical fields to observations table"))}migrateMakeObservationsTextNullable(e){let s=e.query("PRAGMA table_info(observations)").all().find(n=>n.name==="text");if(!(!s||s.notnull===0)){a.info("DB","Making observations.text nullable..."),e.run("BEGIN TRANSACTION");try{e.run(`
        CREATE TABLE observations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          project TEXT NOT NULL,
          text TEXT,
          type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery')),
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
      `),e.run(`
        INSERT INTO observations_new
        SELECT id, sdk_session_id, project, text, type, title, subtitle, facts,
               narrative, concepts, files_read, files_modified, prompt_number,
               created_at, created_at_epoch
        FROM observations
      `),e.run("DROP TABLE observations"),e.run("ALTER TABLE observations_new RENAME TO observations"),e.run("COMMIT"),a.info("DB","Successfully made observations.text nullable")}catch(n){throw e.run("ROLLBACK"),n}}}migrateCreateUserPromptsTable(e){e.query("SELECT name FROM sqlite_master WHERE type='table'").all().some(s=>s.name==="user_prompts")||(a.info("DB","Creating user_prompts table..."),e.run(`
      CREATE TABLE user_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        prompt_number INTEGER NOT NULL,
        prompt_text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        timestamp_epoch INTEGER NOT NULL,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `),e.run("CREATE INDEX idx_user_prompts_session ON user_prompts(sdk_session_id)"),e.run("CREATE INDEX idx_user_prompts_number ON user_prompts(sdk_session_id, prompt_number)"),a.info("DB","Successfully created user_prompts table"))}migrateEnsureDiscoveryTokensColumn(e){e.query("PRAGMA table_info(observations)").all().some(s=>s.name==="discovery_tokens")||e.run("ALTER TABLE observations ADD COLUMN discovery_tokens TEXT")}migrateCreatePendingMessagesTable(e){e.query("SELECT name FROM sqlite_master WHERE type='table'").all().some(s=>s.name==="pending_messages")||(a.info("DB","Creating pending_messages table..."),e.run(`
      CREATE TABLE pending_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `),e.run("CREATE INDEX idx_pending_messages_session ON pending_messages(sdk_session_id)"),a.info("DB","Successfully created pending_messages table"))}migrateCreateAiResponsesAndToolExecutionsTables(e){let t=e.query("SELECT name FROM sqlite_master WHERE type='table'").all();t.some(s=>s.name==="ai_responses")||(a.info("DB","Creating ai_responses table..."),e.run(`
        CREATE TABLE ai_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          prompt_number INTEGER NOT NULL,
          response_text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `),e.run("CREATE INDEX idx_ai_responses_session ON ai_responses(sdk_session_id)")),t.some(s=>s.name==="tool_executions")||(a.info("DB","Creating tool_executions table..."),e.run(`
        CREATE TABLE tool_executions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          prompt_number INTEGER NOT NULL,
          tool_name TEXT NOT NULL,
          tool_input TEXT,
          tool_output TEXT,
          duration_ms INTEGER,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `),e.run("CREATE INDEX idx_tool_executions_session ON tool_executions(sdk_session_id)"),e.run("CREATE INDEX idx_tool_executions_tool ON tool_executions(tool_name)"))}migrateCreateConversationSummariesTable(e){e.query("SELECT name FROM sqlite_master WHERE type='table'").all().some(s=>s.name==="conversation_summaries")||(a.info("DB","Creating conversation_summaries table..."),e.run(`
      CREATE TABLE conversation_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        summary_type TEXT CHECK(summary_type IN ('auto', 'manual', 'ai_enhanced', 'template')) NOT NULL DEFAULT 'auto',
        content TEXT NOT NULL,
        keywords TEXT,
        key_points TEXT,
        summary_length INTEGER,
        confidence_score REAL,
        ai_model TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        updated_at TEXT,
        updated_at_epoch INTEGER,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `),e.run("CREATE INDEX idx_conversation_summaries_session ON conversation_summaries(sdk_session_id)"),e.run("CREATE INDEX idx_conversation_summaries_project ON conversation_summaries(project)"),e.run("CREATE INDEX idx_conversation_summaries_type ON conversation_summaries(summary_type)"),e.run("CREATE INDEX idx_conversation_summaries_created ON conversation_summaries(created_at_epoch DESC)"),a.info("DB","Successfully created conversation_summaries table"))}migrateCreateContentTagsTable(e){if(e.query("SELECT name FROM sqlite_master WHERE type='table'").all().some(i=>i.name==="content_tags"))return;a.info("DB","Creating content_tags table..."),e.run(`
      CREATE TABLE content_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT UNIQUE NOT NULL,
        tag_category TEXT,
        parent_tag_id INTEGER,
        description TEXT,
        color_code TEXT,
        icon_name TEXT,
        usage_count INTEGER DEFAULT 0,
        is_auto_generated BOOLEAN DEFAULT 1,
        is_system_tag BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY(parent_tag_id) REFERENCES content_tags(id)
      )
    `),e.run("CREATE INDEX idx_content_tags_category ON content_tags(tag_category)"),e.run("CREATE INDEX idx_content_tags_parent ON content_tags(parent_tag_id)"),e.run("CREATE INDEX idx_content_tags_usage ON content_tags(usage_count DESC)"),e.run(`
      CREATE VIRTUAL TABLE content_tags_fts USING fts5(
        tag_name, description,
        content='content_tags',
        content_rowid='id'
      )
    `),e.run(`
      CREATE TRIGGER content_tags_ai AFTER INSERT ON content_tags BEGIN
        INSERT INTO content_tags_fts(rowid, tag_name, description)
        VALUES (new.id, new.tag_name, new.description);
      END;
    `),a.info("DB","Successfully created content_tags table");let s=[{name:"bugfix",category:"type",description:"Bug fixes and repairs",color:"#ef4444"},{name:"feature",category:"type",description:"New features and functionality",color:"#22c55e"},{name:"refactor",category:"type",description:"Code refactoring",color:"#3b82f6"},{name:"decision",category:"type",description:"Architecture decisions",color:"#a855f7"},{name:"discovery",category:"type",description:"Findings and discoveries",color:"#f59e0b"},{name:"documentation",category:"type",description:"Documentation updates",color:"#06b6d4"},{name:"testing",category:"type",description:"Tests and QA",color:"#ec4899"},{name:"optimization",category:"type",description:"Performance optimizations",color:"#84cc16"},{name:"security",category:"type",description:"Security improvements",color:"#ef4444"},{name:"frontend",category:"area",description:"Frontend related",color:"#8b5cf6"},{name:"backend",category:"area",description:"Backend related",color:"#6366f1"},{name:"database",category:"area",description:"Database related",color:"#14b8a6"},{name:"api",category:"area",description:"API related",color:"#f97316"}],n=new Date().toISOString();for(let i of s)try{e.run("INSERT INTO content_tags (tag_name, tag_category, description, color_code, is_auto_generated, is_system_tag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",i.name,i.category,i.description,i.color,1,1,n)}catch{}a.info("DB","Added default content tags")}migrateCreateConversationTagsTable(e){e.query("SELECT name FROM sqlite_master WHERE type='table'").all().some(s=>s.name==="conversation_tags")||(a.info("DB","Creating conversation_tags table..."),e.run(`
      CREATE TABLE conversation_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        item_type TEXT CHECK(item_type IN ('user_prompt', 'ai_response', 'observation', 'summary')) NOT NULL,
        item_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        confidence_score REAL DEFAULT 1.0,
        is_auto_generated BOOLEAN DEFAULT 1,
        created_by TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `),e.run("CREATE INDEX idx_conversation_tags_session ON conversation_tags(sdk_session_id)"),e.run("CREATE INDEX idx_conversation_tags_item ON conversation_tags(item_type, item_id)"),e.run("CREATE INDEX idx_conversation_tags_tag ON conversation_tags(tag_id)"),e.run("CREATE INDEX idx_conversation_tags_created ON conversation_tags(created_at_epoch DESC)"),a.info("DB","Successfully created conversation_tags table"))}migrateCreateAnalysisTasksTable(e){e.query("SELECT name FROM sqlite_master WHERE type='table'").all().some(s=>s.name==="analysis_tasks")||(a.info("DB","Creating analysis_tasks table..."),e.run(`
      CREATE TABLE analysis_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        task_type TEXT CHECK(task_type IN ('summary_generation', 'auto_tagging', 'sentiment_analysis')) NOT NULL,
        status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
        priority INTEGER DEFAULT 5,
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `),e.run("CREATE INDEX idx_analysis_tasks_status ON analysis_tasks(status)"),e.run("CREATE INDEX idx_analysis_tasks_priority ON analysis_tasks(priority)"),e.run("CREATE INDEX idx_analysis_tasks_session ON analysis_tasks(sdk_session_id)"),e.run("CREATE INDEX idx_analysis_tasks_type ON analysis_tasks(task_type)"),a.info("DB","Successfully created analysis_tasks table"))}};var V=class{db;migrationRunner;constructor(){Le(y),this.db=new Ce.Database(Ae),this.db.run("PRAGMA journal_mode = WAL"),this.db.run("PRAGMA synchronous = NORMAL"),this.db.run("PRAGMA foreign_keys = ON"),this.initializeSchema(),this.migrationRunner=new q(this.db),this.migrationRunner.runPendingMigrations()}initializeSchema(){try{this.db.run(`
        CREATE TABLE IF NOT EXISTS schema_versions (
          id INTEGER PRIMARY KEY,
          version INTEGER UNIQUE NOT NULL,
          applied_at TEXT NOT NULL
        )
      `);let e=this.db.prepare("SELECT version FROM schema_versions ORDER BY version").all();(e.length>0?Math.max(...e.map(s=>s.version)):0)===0&&(a.info("DB","Initializing fresh database with migration004..."),this.db.run(`
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
        `),this.db.prepare("INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)").run(4,new Date().toISOString()),a.success("DB","Migration004 applied successfully"))}catch(e){throw a.error("DB","Schema initialization error",{},e.message),e}}saveAiResponse(e){try{let s=this.db.prepare(`
        INSERT INTO ai_responses (
          claude_session_id, sdk_session_id, project, prompt_number,
          response_text, response_type, tool_name, tool_input, tool_output,
          created_at, created_at_epoch
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(e.claude_session_id,e.sdk_session_id,e.project,e.prompt_number,e.response_text,e.response_type,e.tool_name,e.tool_input,e.tool_output,e.created_at,e.created_at_epoch),n=Number(s.lastInsertRowid);return a.debug("DB","AI response saved",{aiResponseId:n,responseType:e.response_type}),n}catch(t){throw a.error("DB","Failed to save AI response",{responseType:e.response_type},t),t}}saveToolExecution(e){try{let s=this.db.prepare(`
        INSERT INTO tool_executions (
          ai_response_id, claude_session_id, sdk_session_id, project, prompt_number,
          tool_name, tool_input, tool_output, tool_duration_ms,
          files_created, files_modified, files_read, files_deleted,
          error_message, success, created_at, created_at_epoch
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(e.ai_response_id,e.claude_session_id,e.sdk_session_id,e.project,e.prompt_number,e.tool_name,e.tool_input,e.tool_output,e.tool_duration_ms,e.files_created,e.files_modified,e.files_read,e.files_deleted,e.error_message,e.success?1:0,e.created_at,e.created_at_epoch),n=Number(s.lastInsertRowid);return a.debug("DB","Tool execution saved",{toolExecutionId:n,toolName:e.tool_name,success:e.success}),n}catch(t){throw a.error("DB","Failed to save tool execution",{toolName:e.tool_name},t),t}}getRecentAiResponses(e,t=20){return this.db.prepare(`
      SELECT id, response_text, response_type, tool_name, prompt_number, created_at
      FROM ai_responses
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getRecentToolExecutions(e,t=50){return this.db.prepare(`
      SELECT id, tool_name, tool_input, tool_output,
             files_created, files_modified, files_read, files_deleted,
             success, prompt_number, created_at
      FROM tool_executions
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getAllRecentAiResponses(e=100){return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, prompt_number,
             response_text, response_type, tool_name, tool_input, tool_output,
             created_at, created_at_epoch
      FROM ai_responses
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}validateKeywords(e){let t=/^[a-zA-Z0-9\s\-_\.@:,]+$/;return e.filter(s=>{if(!s||s.trim().length===0)return!1;if(s.length>100)return a.warn("FTS5","Keyword too long, skipping",{length:s.length}),!1;if(!t.test(s))return a.warn("FTS5","Invalid characters in keyword, skipping",{keyword:s}),!1;let n=[/\bor\b/i,/\bnot\b/i,/NEAR\(/i,/\*/];for(let i of n)if(i.test(s))return a.warn("FTS5","Dangerous operator in keyword, skipping",{keyword:s}),!1;return!0}).map(s=>s.trim())}buildFTS5Query(e,t){let s=this.validateKeywords(e);if(s.length===0)throw new Error("No valid keywords after validation");return s.map(n=>`"${n.replace(/"/g,'""')}"`).join(` ${t} `)}getAiResponsesWithKeywords(e=[],t="AND",s,n=0,i=20){if(e.length===0){let N=this.getAllRecentAiResponses(i+n+1),E=s?N.filter(b=>b.project===s):N;return{items:E.slice(n,n+i),total:E.length,hasMore:E.length>n+i}}let d;try{d=this.buildFTS5Query(e,t)}catch(N){return a.error("FTS5","Failed to build search query",{keywords:e},N),{items:[],total:0,hasMore:!1}}let c=`
      SELECT ar.id, ar.claude_session_id, ar.sdk_session_id, ar.project, ar.prompt_number,
             ar.response_text, ar.response_type, ar.tool_name, ar.tool_input, ar.tool_output,
             ar.created_at, ar.created_at_epoch,
             bm25(ai_responses_fts) as rank
      FROM ai_responses ar
      JOIN ai_responses_fts ON ar.id = ai_responses_fts.rowid
      WHERE ai_responses_fts MATCH ?
    `,p=`
      SELECT COUNT(*) as total
      FROM ai_responses ar
      JOIN ai_responses_fts ON ar.id = ai_responses_fts.rowid
      WHERE ai_responses_fts MATCH ?
    `,l=[d];s&&(c+=" AND ar.project = ?",p+=" AND ar.project = ?",l.push(s)),c+=" ORDER BY rank, ar.created_at_epoch DESC LIMIT ? OFFSET ?",l.push(i+1,n);let m=this.db.prepare(c).all(...l),g=this.db.prepare(p).get(d,...s?[s]:[]),S=m.length>i;return{items:S?m.slice(0,i):m,total:g.total,hasMore:S}}getAllRecentToolExecutions(e=100){return this.db.prepare(`
      SELECT id, ai_response_id, claude_session_id, sdk_session_id, project,
             prompt_number, tool_name, tool_input, tool_output, tool_duration_ms,
             files_created, files_modified, files_read, files_deleted,
             error_message, success, created_at, created_at_epoch
      FROM tool_executions
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e)}getRecentSummaries(e,t=10){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getRecentSummariesWithSessionInfo(e,t=3){return this.db.prepare(`
      SELECT
        sdk_session_id, request, learned, completed, next_steps,
        prompt_number, created_at
      FROM session_summaries
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getRecentObservations(e,t=20){return this.db.prepare(`
      SELECT type, text, prompt_number, created_at
      FROM observations
      WHERE project = ?
      ORDER BY created_at_epoch DESC
      LIMIT ?
    `).all(e,t)}getAllRecentObservations(e=100){return this.db.prepare(`
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
    `).all().map(s=>s.project)}getLatestUserPrompt(e){return this.db.prepare(`
      SELECT
        up.*,
        s.sdk_session_id,
        s.project
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.claude_session_id = ?
      ORDER BY up.created_at_epoch DESC
      LIMIT 1
    `).get(e)}getRecentSessionsWithStatus(e,t=3){return this.db.prepare(`
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
    `).all(e,t)}getObservationsForSession(e){return this.db.prepare(`
      SELECT title, subtitle, type, prompt_number
      FROM observations
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch ASC
    `).all(e)}getObservationById(e){return this.db.prepare(`
      SELECT *
      FROM observations
      WHERE id = ?
    `).get(e)||null}getObservationsByIds(e,t={}){if(e.length===0)return[];let{orderBy:s="date_desc",limit:n,project:i,type:d,concepts:c,files:p}=t,l=s==="date_asc"?"ASC":"DESC",m=n?`LIMIT ${n}`:"",g=e.map(()=>"?").join(","),S=[...e],f=[];if(i&&(f.push("project = ?"),S.push(i)),d)if(Array.isArray(d)){let r=d.map(()=>"?").join(",");f.push(`type IN (${r})`),S.push(...d)}else f.push("type = ?"),S.push(d);if(c){let r=Array.isArray(c)?c:[c],b=r.map(()=>"EXISTS (SELECT 1 FROM json_each(concepts) WHERE value = ?)");S.push(...r),f.push(`(${b.join(" OR ")})`)}if(p){let r=Array.isArray(p)?p:[p],b=r.map(()=>"(EXISTS (SELECT 1 FROM json_each(files_read) WHERE value LIKE ?) OR EXISTS (SELECT 1 FROM json_each(files_modified) WHERE value LIKE ?))");r.forEach(L=>{S.push(`%${L}%`,`%${L}%`)}),f.push(`(${b.join(" OR ")})`)}let N=f.length>0?`WHERE id IN (${g}) AND ${f.join(" AND ")}`:`WHERE id IN (${g})`;return this.db.prepare(`
      SELECT *
      FROM observations
      ${N}
      ORDER BY created_at_epoch ${l}
      ${m}
    `).all(...S)}getSummaryForSession(e){return this.db.prepare(`
      SELECT
        request, investigated, learned, completed, next_steps,
        files_read, files_edited, notes, prompt_number, created_at
      FROM session_summaries
      WHERE sdk_session_id = ?
      ORDER BY created_at_epoch DESC
      LIMIT 1
    `).get(e)||null}getFilesForSession(e){let s=this.db.prepare(`
      SELECT files_read, files_modified
      FROM observations
      WHERE sdk_session_id = ?
    `).all(e),n=new Set,i=new Set;for(let d of s){if(d.files_read)try{let c=JSON.parse(d.files_read);Array.isArray(c)&&c.forEach(p=>n.add(p))}catch{}if(d.files_modified)try{let c=JSON.parse(d.files_modified);Array.isArray(c)&&c.forEach(p=>i.add(p))}catch{}}return{filesRead:Array.from(n),filesModified:Array.from(i)}}getSessionById(e){return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)||null}getSdkSessionsBySessionIds(e){if(e.length===0)return[];let t=e.map(()=>"?").join(",");return this.db.prepare(`
      SELECT id, claude_session_id, sdk_session_id, project, user_prompt,
             started_at, started_at_epoch, completed_at, completed_at_epoch, status
      FROM sdk_sessions
      WHERE sdk_session_id IN (${t})
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
    `).get(e)||null}reactivateSession(e,t){this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'active', user_prompt = ?, worker_port = NULL
      WHERE id = ?
    `).run(t,e)}incrementPromptCounter(e){return this.db.prepare(`
      UPDATE sdk_sessions
      SET prompt_counter = COALESCE(prompt_counter, 0) + 1
      WHERE id = ?
    `).run(e),this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||1}getPromptCounter(e){return this.db.prepare(`
      SELECT prompt_counter FROM sdk_sessions WHERE id = ?
    `).get(e)?.prompt_counter||0}createSDKSession(e,t,s){let n=new Date,i=n.getTime();return this.db.prepare(`
      INSERT INTO sdk_sessions
      (claude_session_id, sdk_session_id, project, user_prompt, started_at, started_at_epoch, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
      ON CONFLICT(claude_session_id) DO UPDATE SET
        project = COALESCE(NULLIF(?, ''), project),
        user_prompt = COALESCE(NULLIF(?, ''), user_prompt)
      WHERE claude_session_id = ?
    `).run(e,e,t,s,n.toISOString(),i,t,s,e),this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE claude_session_id = ? LIMIT 1
    `).get(e).id}updateSDKSessionId(e,t){return this.db.prepare(`
      UPDATE sdk_sessions
      SET sdk_session_id = ?
      WHERE id = ? AND sdk_session_id IS NULL
    `).run(t,e).changes===0?(a.debug("DB","sdk_session_id already set, skipping update",{sessionId:e,sdkSessionId:t}),!1):!0}setWorkerPort(e,t){this.db.prepare(`
      UPDATE sdk_sessions
      SET worker_port = ?
      WHERE id = ?
    `).run(t,e)}getWorkerPort(e){return this.db.prepare(`
      SELECT worker_port
      FROM sdk_sessions
      WHERE id = ?
      LIMIT 1
    `).get(e)?.worker_port||null}saveUserPrompt(e,t,s){let n=new Date,i=n.getTime();return this.db.prepare(`
      INSERT INTO user_prompts
      (claude_session_id, prompt_number, prompt_text, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?)
    `).run(e,t,s,n.toISOString(),i).lastInsertRowid}getUserPrompt(e,t){return this.db.prepare(`
      SELECT prompt_text
      FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
      LIMIT 1
    `).get(e,t)?.prompt_text??null}storeObservation(e,t,s,n,i=0){let d=new Date,c=d.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,t,d.toISOString(),c),a.info("DB",`Auto-created session record for session_id: ${e}`));let g=this.db.prepare(`
      INSERT INTO observations
      (sdk_session_id, project, type, title, subtitle, facts, narrative, concepts,
       files_read, files_modified, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,t,s.type,s.title,s.subtitle,JSON.stringify(s.facts),s.narrative,JSON.stringify(s.concepts),JSON.stringify(s.files_read),JSON.stringify(s.files_modified),n||null,i,d.toISOString(),c);return{id:Number(g.lastInsertRowid),createdAtEpoch:c}}storeSummary(e,t,s,n,i=0){let d=new Date,c=d.getTime();this.db.prepare(`
      SELECT id FROM sdk_sessions WHERE sdk_session_id = ?
    `).get(e)||(this.db.prepare(`
        INSERT INTO sdk_sessions
        (claude_session_id, sdk_session_id, project, started_at, started_at_epoch, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(e,e,t,d.toISOString(),c),a.info("DB",`Auto-created session record for session_id: ${e}`));let g=this.db.prepare(`
      INSERT INTO session_summaries
      (sdk_session_id, project, request, investigated, learned, completed,
       next_steps, notes, prompt_number, discovery_tokens, created_at, created_at_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e,t,s.request,s.investigated,s.learned,s.completed,s.next_steps,s.notes,n||null,i,d.toISOString(),c);return{id:Number(g.lastInsertRowid),createdAtEpoch:c}}markSessionCompleted(e){let t=new Date,s=t.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'completed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(t.toISOString(),s,e)}markSessionFailed(e){let t=new Date,s=t.getTime();this.db.prepare(`
      UPDATE sdk_sessions
      SET status = 'failed', completed_at = ?, completed_at_epoch = ?
      WHERE id = ?
    `).run(t.toISOString(),s,e)}getSessionSummariesByIds(e,t={}){if(e.length===0)return[];let{orderBy:s="date_desc",limit:n,project:i}=t,d=s==="date_asc"?"ASC":"DESC",c=n?`LIMIT ${n}`:"",p=e.map(()=>"?").join(","),l=[...e],m=i?`WHERE id IN (${p}) AND project = ?`:`WHERE id IN (${p})`;return i&&l.push(i),this.db.prepare(`
      SELECT * FROM session_summaries
      ${m}
      ORDER BY created_at_epoch ${d}
      ${c}
    `).all(...l)}getUserPromptsByIds(e,t={}){if(e.length===0)return[];let{orderBy:s="date_desc",limit:n,project:i}=t,d=s==="date_asc"?"ASC":"DESC",c=n?`LIMIT ${n}`:"",p=e.map(()=>"?").join(","),l=[...e],m=i?"AND s.project = ?":"";return i&&l.push(i),this.db.prepare(`
      SELECT
        up.*,
        s.project,
        s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.id IN (${p}) ${m}
      ORDER BY up.created_at_epoch ${d}
      ${c}
    `).all(...l)}getTimelineAroundTimestamp(e,t=10,s=10,n){return this.getTimelineAroundObservation(null,e,t,s,n)}getTimelineAroundObservation(e,t,s=10,n=10,i){let d=i?"AND project = ?":"",c=i?[i]:[],p,l;if(e!==null){let f=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id <= ? ${d}
        ORDER BY id DESC
        LIMIT ?
      `,N=`
        SELECT id, created_at_epoch
        FROM observations
        WHERE id >= ? ${d}
        ORDER BY id ASC
        LIMIT ?
      `;try{let E=this.db.prepare(f).all(e,...c,s+1),r=this.db.prepare(N).all(e,...c,n+1);if(E.length===0&&r.length===0)return{observations:[],sessions:[],prompts:[]};p=E.length>0?E[E.length-1].created_at_epoch:t,l=r.length>0?r[r.length-1].created_at_epoch:t}catch(E){return a.error("DB"," Error getting boundary observations:",E.message,i?`(project: ${i})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}else{let f=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch <= ? ${d}
        ORDER BY created_at_epoch DESC
        LIMIT ?
      `,N=`
        SELECT created_at_epoch
        FROM observations
        WHERE created_at_epoch >= ? ${d}
        ORDER BY created_at_epoch ASC
        LIMIT ?
      `;try{let E=this.db.prepare(f).all(t,...c,s),r=this.db.prepare(N).all(t,...c,n+1);if(E.length===0&&r.length===0)return{observations:[],sessions:[],prompts:[]};p=E.length>0?E[E.length-1].created_at_epoch:t,l=r.length>0?r[r.length-1].created_at_epoch:t}catch(E){return a.error("DB"," Error getting boundary timestamps:",E.message,i?`(project: ${i})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}let m=`
      SELECT *
      FROM observations
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${d}
      ORDER BY created_at_epoch ASC
    `,g=`
      SELECT *
      FROM session_summaries
      WHERE created_at_epoch >= ? AND created_at_epoch <= ? ${d}
      ORDER BY created_at_epoch ASC
    `,S=`
      SELECT up.*, s.project, s.sdk_session_id
      FROM user_prompts up
      JOIN sdk_sessions s ON up.claude_session_id = s.claude_session_id
      WHERE up.created_at_epoch >= ? AND up.created_at_epoch <= ? ${d.replace("project","s.project")}
      ORDER BY up.created_at_epoch ASC
    `;try{let f=this.db.prepare(m).all(p,l,...c),N=this.db.prepare(g).all(p,l,...c),E=this.db.prepare(S).all(p,l,...c);return{observations:f,sessions:N.map(r=>({id:r.id,sdk_session_id:r.sdk_session_id,project:r.project,request:r.request,completed:r.completed,next_steps:r.next_steps,created_at:r.created_at,created_at_epoch:r.created_at_epoch})),prompts:E.map(r=>({id:r.id,claude_session_id:r.claude_session_id,prompt_number:r.prompt_number,prompt_text:r.prompt_text,project:r.project,created_at:r.created_at,created_at_epoch:r.created_at_epoch}))}}catch(f){return a.error("DB"," Error querying timeline records:",f.message,i?`(project: ${i})`:"(all projects)"),{observations:[],sessions:[],prompts:[]}}}getPromptById(e){return this.db.prepare(`
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
    `).get(e)||null}getPromptsByIds(e){if(e.length===0)return[];let t=e.map(()=>"?").join(",");return this.db.prepare(`
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
      WHERE p.id IN (${t})
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
    `).get(e)||null}close(){this.db.close()}importSdkSession(e){let t=this.db.prepare("SELECT id FROM sdk_sessions WHERE claude_session_id = ?").get(e.claude_session_id);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO sdk_sessions (
        claude_session_id, sdk_session_id, project, user_prompt,
        started_at, started_at_epoch, completed_at, completed_at_epoch, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.sdk_session_id,e.project,e.user_prompt,e.started_at,e.started_at_epoch,e.completed_at,e.completed_at_epoch,e.status).lastInsertRowid}}importSessionSummary(e){let t=this.db.prepare("SELECT id FROM session_summaries WHERE sdk_session_id = ?").get(e.sdk_session_id);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO session_summaries (
        sdk_session_id, project, request, investigated, learned,
        completed, next_steps, files_read, files_edited, notes,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.request,e.investigated,e.learned,e.completed,e.next_steps,e.files_read,e.files_edited,e.notes,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importObservation(e){let t=this.db.prepare(`
      SELECT id FROM observations
      WHERE sdk_session_id = ? AND title = ? AND created_at_epoch = ?
    `).get(e.sdk_session_id,e.title,e.created_at_epoch);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO observations (
        sdk_session_id, project, text, type, title, subtitle,
        facts, narrative, concepts, files_read, files_modified,
        prompt_number, discovery_tokens, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.sdk_session_id,e.project,e.text,e.type,e.title,e.subtitle,e.facts,e.narrative,e.concepts,e.files_read,e.files_modified,e.prompt_number,e.discovery_tokens||0,e.created_at,e.created_at_epoch).lastInsertRowid}}importUserPrompt(e){let t=this.db.prepare(`
      SELECT id FROM user_prompts
      WHERE claude_session_id = ? AND prompt_number = ?
    `).get(e.claude_session_id,e.prompt_number);return t?{imported:!1,id:t.id}:{imported:!0,id:this.db.prepare(`
      INSERT INTO user_prompts (
        claude_session_id, prompt_number, prompt_text,
        created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?)
    `).run(e.claude_session_id,e.prompt_number,e.prompt_text,e.created_at,e.created_at_epoch).lastInsertRowid}}};var _e=se(require("path"),1);function de(_){if(!_)return[];try{let e=JSON.parse(_);return Array.isArray(e)?e:[]}catch{return[]}}function Ie(_){return new Date(_).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:!0})}function ye(_){return new Date(_).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}function De(_){return new Date(_).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric"})}function Ve(_,e){return _e.default.isAbsolute(_)?_e.default.relative(e,_):_}function ve(_,e){let t=de(_);return t.length>0?Ve(t[0],e):"General"}var ke=se(require("path"),1);function Me(_){if(!_||_.trim()==="")return a.warn("PROJECT_NAME","Empty cwd provided, using fallback",{cwd:_}),"unknown-project";let e=ke.default.basename(_);if(e===""){if(process.platform==="win32"){let s=_.match(/^([A-Z]):\\/i);if(s){let i=`drive-${s[1].toUpperCase()}`;return a.info("PROJECT_NAME","Drive root detected",{cwd:_,projectName:i}),i}}return a.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:_}),"unknown-project"}return e}var Je=Q.default.join((0,z.homedir)(),".claude","plugins","marketplaces","chengjon","plugin",".install-version");function Qe(){let _=Q.default.join((0,z.homedir)(),".mem-claude","settings.json"),e=M.loadFromFile(_);try{return{totalObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_OBSERVATIONS,10),fullObservationCount:parseInt(e.CLAUDE_MEM_CONTEXT_FULL_COUNT,10),sessionCount:parseInt(e.CLAUDE_MEM_CONTEXT_SESSION_COUNT,10),showReadTokens:e.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS==="true",showWorkTokens:e.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS==="true",showSavingsAmount:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT==="true",showSavingsPercent:e.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT==="true",observationTypes:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES.split(",").map(t=>t.trim()).filter(Boolean)),observationConcepts:new Set(e.CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS.split(",").map(t=>t.trim()).filter(Boolean)),fullObservationField:e.CLAUDE_MEM_CONTEXT_FULL_FIELD,showLastSummary:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY==="true",showLastMessage:e.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE==="true"}}catch(t){return a.warn("WORKER","Failed to load context settings, using defaults",{},t),{totalObservationCount:50,fullObservationCount:5,sessionCount:10,showReadTokens:!0,showWorkTokens:!0,showSavingsAmount:!0,showSavingsPercent:!0,observationTypes:new Set(re),observationConcepts:new Set(ne),fullObservationField:"narrative",showLastSummary:!0,showLastMessage:!1}}}var Ue=4,ze=1,o={reset:"\x1B[0m",bright:"\x1B[1m",dim:"\x1B[2m",cyan:"\x1B[36m",green:"\x1B[32m",yellow:"\x1B[33m",blue:"\x1B[34m",magenta:"\x1B[35m",gray:"\x1B[90m",red:"\x1B[31m"};function J(_,e,t,s){return e?s?[`${t}${_}:${o.reset} ${e}`,""]:[`**${_}**: ${e}`,""]:[]}function Ze(_){return _.replace(/\//g,"-")}function et(_){try{if(!(0,P.existsSync)(_))return{userMessage:"",assistantMessage:""};let e=(0,P.readFileSync)(_,"utf-8").trim();if(!e)return{userMessage:"",assistantMessage:""};let t=e.split(`
`).filter(n=>n.trim()),s="";for(let n=t.length-1;n>=0;n--)try{let i=t[n];if(!i.includes('"type":"assistant"'))continue;let d=JSON.parse(i);if(d.type==="assistant"&&d.message?.content&&Array.isArray(d.message.content)){let c="";for(let p of d.message.content)p.type==="text"&&(c+=p.text);if(c=c.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g,"").trim(),c){s=c;break}}}catch{continue}return{userMessage:"",assistantMessage:s}}catch(e){return a.failure("WORKER","Failed to extract prior messages from transcript",{transcriptPath:_},e),{userMessage:"",assistantMessage:""}}}async function tt(_,e=!1){let t=Qe(),s=_?.cwd??process.cwd(),n=Me(s),i=null;try{i=new V}catch(b){if(b.code==="ERR_DLOPEN_FAILED"){try{(0,P.unlinkSync)(Je)}catch{}return a.error("Native module rebuild needed - restart Claude Code to auto-fix"),""}throw b}let d=Array.from(t.observationTypes),c=d.map(()=>"?").join(","),p=Array.from(t.observationConcepts),l=p.map(()=>"?").join(","),m=i.db.prepare(`
    SELECT
      id, sdk_session_id, type, title, subtitle, narrative,
      facts, concepts, files_read, files_modified, discovery_tokens,
      created_at, created_at_epoch
    FROM observations
    WHERE project = ?
      AND type IN (${c})
      AND EXISTS (
        SELECT 1 FROM json_each(concepts)
        WHERE value IN (${l})
      )
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(n,...d,...p,t.totalObservationCount),g=i.db.prepare(`
    SELECT id, sdk_session_id, request, investigated, learned, completed, next_steps, created_at, created_at_epoch
    FROM session_summaries
    WHERE project = ?
    ORDER BY created_at_epoch DESC
    LIMIT ?
  `).all(n,t.sessionCount+ze),S="",f="";if(t.showLastMessage&&m.length>0)try{let b=_?.session_id,L=m.find(O=>O.sdk_session_id!==b);if(L){let O=L.sdk_session_id,D=Ze(s),F=Q.default.join((0,z.homedir)(),".claude","projects",D,`${O}.jsonl`),j=et(F);S=j.userMessage,f=j.assistantMessage}}catch{}if(m.length===0&&g.length===0)return i?.close(),e?`
${o.bright}${o.cyan}[${n}] recent context${o.reset}
${o.gray}${"\u2500".repeat(60)}${o.reset}

${o.dim}No previous sessions found for this project yet.${o.reset}
`:`# [${n}] recent context

No previous sessions found for this project yet.`;let N=g.slice(0,t.sessionCount),E=m,r=[];if(e?(r.push(""),r.push(`${o.bright}${o.cyan}[${n}] recent context${o.reset}`),r.push(`${o.gray}${"\u2500".repeat(60)}${o.reset}`),r.push("")):(r.push(`# [${n}] recent context`),r.push("")),E.length>0){e?r.push(`${o.dim}Legend: \u{1F3AF} session-request | \u{1F534} bugfix | \u{1F7E3} feature | \u{1F504} refactor | \u2705 change | \u{1F535} discovery | \u2696\uFE0F  decision${o.reset}`):r.push("**Legend:** \u{1F3AF} session-request | \u{1F534} bugfix | \u{1F7E3} feature | \u{1F504} refactor | \u2705 change | \u{1F535} discovery | \u2696\uFE0F  decision"),r.push(""),e?(r.push(`${o.bright}\u{1F4A1} Column Key${o.reset}`),r.push(`${o.dim}  Read: Tokens to read this observation (cost to learn it now)${o.reset}`),r.push(`${o.dim}  Work: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)${o.reset}`)):(r.push("\u{1F4A1} **Column Key**:"),r.push("- **Read**: Tokens to read this observation (cost to learn it now)"),r.push("- **Work**: Tokens spent on work that produced this record (\u{1F50D} research, \u{1F6E0}\uFE0F building, \u2696\uFE0F  deciding)")),r.push(""),e?(r.push(`${o.dim}\u{1F4A1} Context Index: This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.${o.reset}`),r.push(""),r.push(`${o.dim}When you need implementation details, rationale, or debugging context:${o.reset}`),r.push(`${o.dim}  - Use the mem-search skill to fetch full observations on-demand${o.reset}`),r.push(`${o.dim}  - Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching${o.reset}`),r.push(`${o.dim}  - Trust this index over re-reading code for past decisions and learnings${o.reset}`)):(r.push("\u{1F4A1} **Context Index:** This semantic index (titles, types, files, tokens) is usually sufficient to understand past work."),r.push(""),r.push("When you need implementation details, rationale, or debugging context:"),r.push("- Use the mem-search skill to fetch full observations on-demand"),r.push("- Critical types (\u{1F534} bugfix, \u2696\uFE0F decision) often need detailed fetching"),r.push("- Trust this index over re-reading code for past decisions and learnings")),r.push("");let b=m.length,L=m.reduce((u,h)=>{let R=(h.title?.length||0)+(h.subtitle?.length||0)+(h.narrative?.length||0)+JSON.stringify(h.facts||[]).length;return u+Math.ceil(R/Ue)},0),O=m.reduce((u,h)=>u+(h.discovery_tokens||0),0),D=O-L,F=O>0?Math.round(D/O*100):0,j=t.showReadTokens||t.showWorkTokens||t.showSavingsAmount||t.showSavingsPercent;if(j)if(e){if(r.push(`${o.bright}${o.cyan}\u{1F4CA} Context Economics${o.reset}`),r.push(`${o.dim}  Loading: ${b} observations (${L.toLocaleString()} tokens to read)${o.reset}`),r.push(`${o.dim}  Work investment: ${O.toLocaleString()} tokens spent on research, building, and decisions${o.reset}`),O>0&&(t.showSavingsAmount||t.showSavingsPercent)){let u="  Your savings: ";t.showSavingsAmount&&t.showSavingsPercent?u+=`${D.toLocaleString()} tokens (${F}% reduction from reuse)`:t.showSavingsAmount?u+=`${D.toLocaleString()} tokens`:u+=`${F}% reduction from reuse`,r.push(`${o.green}${u}${o.reset}`)}r.push("")}else{if(r.push("\u{1F4CA} **Context Economics**:"),r.push(`- Loading: ${b} observations (${L.toLocaleString()} tokens to read)`),r.push(`- Work investment: ${O.toLocaleString()} tokens spent on research, building, and decisions`),O>0&&(t.showSavingsAmount||t.showSavingsPercent)){let u="- Your savings: ";t.showSavingsAmount&&t.showSavingsPercent?u+=`${D.toLocaleString()} tokens (${F}% reduction from reuse)`:t.showSavingsAmount?u+=`${D.toLocaleString()} tokens`:u+=`${F}% reduction from reuse`,r.push(u)}r.push("")}let $e=g[0]?.id,xe=N.map((u,h)=>{let R=h===0?null:g[h+1];return{...u,displayEpoch:R?R.created_at_epoch:u.created_at_epoch,displayTime:R?R.created_at:u.created_at,shouldShowLink:u.id!==$e}}),Fe=new Set(m.slice(0,t.fullObservationCount).map(u=>u.id)),ce=[...E.map(u=>({type:"observation",data:u})),...xe.map(u=>({type:"summary",data:u}))];ce.sort((u,h)=>{let R=u.type==="observation"?u.data.created_at_epoch:u.data.displayEpoch,v=h.type==="observation"?h.data.created_at_epoch:h.data.displayEpoch;return R-v});let W=new Map;for(let u of ce){let h=u.type==="observation"?u.data.created_at:u.data.displayTime,R=De(h);W.has(R)||W.set(R,[]),W.get(R).push(u)}let Xe=Array.from(W.entries()).sort((u,h)=>{let R=new Date(u[0]).getTime(),v=new Date(h[0]).getTime();return R-v});for(let[u,h]of Xe){e?(r.push(`${o.bright}${o.cyan}${u}${o.reset}`),r.push("")):(r.push(`### ${u}`),r.push(""));let R=null,v="",U=!1;for(let Z of h)if(Z.type==="summary"){U&&(r.push(""),U=!1,R=null,v="");let T=Z.data,$=`${T.request||"Session started"} (${Ie(T.displayTime)})`;e?r.push(`\u{1F3AF} ${o.yellow}#S${T.id}${o.reset} ${$}`):r.push(`**\u{1F3AF} #S${T.id}** ${$}`),r.push("")}else{let T=Z.data,$=ve(T.files_modified,s);$!==R&&(U&&r.push(""),e?r.push(`${o.dim}${$}${o.reset}`):r.push(`**${$}**`),e||(r.push("| ID | Time | T | Title | Read | Work |"),r.push("|----|------|---|-------|------|------|")),R=$,U=!0,v="");let x=ye(T.created_at),H=T.title||"Untitled",G=ge[T.type]||"\u2022",we=(T.title?.length||0)+(T.subtitle?.length||0)+(T.narrative?.length||0)+JSON.stringify(T.facts||[]).length,X=Math.ceil(we/Ue),w=T.discovery_tokens||0,ee=Te[T.type]||"\u{1F50D}",pe=w>0?`${ee} ${w.toLocaleString()}`:"-",te=x!==v,le=te?x:"";if(v=x,Fe.has(T.id)){let k=t.fullObservationField==="narrative"?T.narrative:T.facts?de(T.facts).join(`
`):null;if(e){let I=te?`${o.dim}${x}${o.reset}`:" ".repeat(x.length),Y=t.showReadTokens&&X>0?`${o.dim}(~${X}t)${o.reset}`:"",me=t.showWorkTokens&&w>0?`${o.dim}(${ee} ${w.toLocaleString()}t)${o.reset}`:"";r.push(`  ${o.dim}#${T.id}${o.reset}  ${I}  ${G}  ${o.bright}${H}${o.reset}`),k&&r.push(`    ${o.dim}${k}${o.reset}`),(Y||me)&&r.push(`    ${Y} ${me}`),r.push("")}else{U&&(r.push(""),U=!1),r.push(`**#${T.id}** ${le||"\u2033"} ${G} **${H}**`),k&&(r.push(""),r.push(k),r.push(""));let I=[];t.showReadTokens&&I.push(`Read: ~${X}`),t.showWorkTokens&&I.push(`Work: ${pe}`),I.length>0&&r.push(I.join(", ")),r.push(""),R=null}}else if(e){let k=te?`${o.dim}${x}${o.reset}`:" ".repeat(x.length),I=t.showReadTokens&&X>0?`${o.dim}(~${X}t)${o.reset}`:"",Y=t.showWorkTokens&&w>0?`${o.dim}(${ee} ${w.toLocaleString()}t)${o.reset}`:"";r.push(`  ${o.dim}#${T.id}${o.reset}  ${k}  ${G}  ${H} ${I} ${Y}`)}else{let k=t.showReadTokens?`~${X}`:"",I=t.showWorkTokens?pe:"";r.push(`| #${T.id} | ${le||"\u2033"} | ${G} | ${H} | ${k} | ${I} |`)}}U&&r.push("")}let C=g[0],ue=m[0];if(t.showLastSummary&&C&&(C.investigated||C.learned||C.completed||C.next_steps)&&(!ue||C.created_at_epoch>ue.created_at_epoch)&&(r.push(...J("Investigated",C.investigated,o.blue,e)),r.push(...J("Learned",C.learned,o.yellow,e)),r.push(...J("Completed",C.completed,o.green,e)),r.push(...J("Next Steps",C.next_steps,o.magenta,e))),f&&(r.push(""),r.push("---"),r.push(""),e?(r.push(`${o.bright}${o.magenta}\u{1F4CB} Previously${o.reset}`),r.push(""),r.push(`${o.dim}A: ${f}${o.reset}`)):(r.push("**\u{1F4CB} Previously**"),r.push(""),r.push(`A: ${f}`)),r.push("")),j&&O>0&&D>0){let u=Math.round(O/1e3);r.push(""),e?r.push(`${o.dim}\u{1F4B0} Access ${u}k tokens of past research & decisions for just ${L.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.${o.reset}`):r.push(`\u{1F4B0} Access ${u}k tokens of past research & decisions for just ${L.toLocaleString()}t. Use the mem-search skill to access memories by ID instead of re-reading files.`)}}return i?.close(),r.join(`
`).trimEnd()}0&&(module.exports={generateContext});
