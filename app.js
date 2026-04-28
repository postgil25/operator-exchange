(function(){
    const WA = '2348065062418';
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/1t8sywPs9mSf4p3tNqrOzbd9nYujvwv2ixyPmtP6ltEo/export?format=csv&gid=1489947803';

    const DEMO = [
        { name:'Adebayo Okoro', trade:'Excavator Operator', photo:'', machines:'CAT 320D, Komatsu PC200', hours:'8,500 hrs', env:'Swamp, Urban, Highway', steps:'Step 1: Positioned the CAT 320D at a 30° offset from the trench line to maximise reach without destabilising the bank.\nStep 2: Engaged a controlled bucket-drag to clear waterlogged clay — gear set to Fine Mode to prevent over-dig.\nStep 3: Used the boom-float function to level the trench base within ±5cm tolerance, verified by laser level.', video:'', availability:'Available', maneuver_fee:'' },
        { name:'Chinedu Amadi', trade:'Crane Operator', photo:'', machines:'Liebherr LTM 1100, Tadano GR-800EX', hours:'12,000 hrs', env:'High-Rise, Industrial, Port', steps:'Step 1: Conducted a pre-lift radius check — confirmed the 40-ton load was within 85% of the chart capacity at 18m radius.\nStep 2: Executed a blind lift using a signal man on channel 4. Maintained a 2m/min hoist speed to prevent swing.\nStep 3: Set the load down on a 3-point crib stack, achieving zero-contact with adjacent structural steel.', video:'', availability:'On Project', maneuver_fee:'' },
        { name:'Fatima Bello', trade:'Bulldozer Operator', photo:'', machines:'CAT D8T, Komatsu D65PX', hours:'6,200 hrs', env:'Road Construction, Mining, Land Clearing', steps:'Step 1: Set the blade to a 15° angle-tilt for side-casting spoil on a 6% grade without losing material downhill.\nStep 2: Maintained constant track speed in 2nd gear to build uniform compaction on the sub-base layer.\nStep 3: Used GPS-guided auto-blade to finish-grade the surface to ±2cm of design elevation.', video:'', availability:'Open to Offers', maneuver_fee:'' },
        { name:'Ibrahim Yusuf', trade:'Roller Operator', photo:'', machines:'BOMAG BW 213, Dynapac CA2500', hours:'4,800 hrs', env:'Asphalt, Road Construction, Dam', steps:'Step 1: Set the BOMAG to high-amplitude vibration for the initial 3 passes on the aggregate base course.\nStep 2: Switched to low-amplitude for the final 2 passes to avoid crushing the aggregate and maintain interlock.\nStep 3: Applied a static finish pass on the asphalt wearing course at 3 km/h to eliminate roller marks.', video:'', availability:'Available', maneuver_fee:'8,000' },
        { name:'Blessing Eze', trade:'Forklift Operator', photo:'', machines:'Toyota 8FG25, Hyster H50FT', hours:'3,400 hrs', env:'Warehouse, Port, Manufacturing', steps:'Step 1: Approached the 2.2-ton pallet stack at creep speed with mast tilted 4° back for load stability.\nStep 2: Inserted forks to full depth, confirmed even weight distribution before lifting above 3m rack height.\nStep 3: Deposited load on the 4th tier rack with ±3cm lateral accuracy using side-shift adjustment.', video:'', availability:'Available', maneuver_fee:'5,000' },
        { name:'Emeka Nwosu', trade:'Grader Operator', photo:'', machines:'CAT 140M, John Deere 672G', hours:'7,100 hrs', env:'Road Construction, Mining, Airport', steps:'Step 1: Set the moldboard at a 45° angle with 12° of blade lean to windrow material to the road shoulder.\nStep 2: Maintained a consistent 4 km/h pass speed to achieve uniform cut depth on laterite sub-grade.\nStep 3: Final-trimmed the crown at 3% cross-slope using laser-guided controls for drainage compliance.', video:'', availability:'On Project', maneuver_fee:'' }
    ];

    let operators = [];
    let activeTrade = 'all';
    let searchTerm = '';
    let initialRenderDone = false;
    let isDemoMode = false;

    // --- CSV Parser ---
    function parseCSV(text) {
        const lines = []; let current = ''; let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') { inQuotes = !inQuotes; current += c; }
            else if (c === '\n' && !inQuotes) { lines.push(current); current = ''; }
            else { current += c; }
        }
        if (current.trim()) lines.push(current);
        if (lines.length < 2) return [];
        const parseRow = (row) => {
            const fields = []; let field = ''; let q = false;
            for (let i = 0; i < row.length; i++) {
                const c = row[i];
                if (c === '"') { q = !q; }
                else if (c === ',' && !q) { fields.push(field.trim()); field = ''; }
                else { field += c; }
            }
            fields.push(field.trim()); return fields;
        };
        const headers = parseRow(lines[0]).map(h => h.replace(/\n/g,' ').replace(/\(.*$/s,'').trim().toLowerCase());
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const vals = parseRow(lines[i]); const row = {};
            headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
            results.push(row);
        }
        return results;
    }

    function matchCol(row, keywords) {
        for (const key of Object.keys(row))
            for (const kw of keywords)
                if (key.includes(kw)) return row[key];
        return '';
    }

    function normalise(rows) {
        return rows.map(r => ({
            name:         matchCol(r, ['full name','name']) || 'Unknown',
            trade:        matchCol(r, ['primary trade','trade']) || 'Operator',
            photo:        matchCol(r, ['profile photo','photo','headshot']) || '',
            machines:     matchCol(r, ['machine specialty','machine']) || '',
            hours:        matchCol(r, ['career seat time','seat time','hours']) || '',
            env:          matchCol(r, ['environment mastery','environment']) || '',
            steps:        matchCol(r, ['operational logic','logic','steps']) || '',
            video:        matchCol(r, ['proof clip','video','youtube']) || '',
            availability: matchCol(r, ['availability','status']) || '',
            maneuver_fee: matchCol(r, ['maneuver fee','custom maneuver','maneuver_fee']) || ''
        }));
    }

    function calcBACS(op) {
        let score = 7.0;
        const hrs = parseInt((op.hours||'').replace(/[^0-9]/g,'')) || 0;
        if (hrs > 10000) score += 1.5;
        else if (hrs > 5000) score += 1.0;
        else if (hrs > 2000) score += 0.5;
        const envCount = (op.env||'').split(',').filter(e=>e.trim()).length;
        if (envCount >= 3) score += 0.8;
        else if (envCount >= 2) score += 0.4;
        if (op.steps && op.steps.length > 100) score += 0.5;
        if (op.video) score += 0.2;
        return Math.min(score, 9.9).toFixed(1);
    }

    function getInitials(name) {
        return name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    }

    function countUp(el, target, duration) {
        let start = 0; const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { el.textContent = target; clearInterval(timer); }
            else { el.textContent = Math.floor(start); }
        }, 16);
    }

    function availabilityBadge(status) {
        const map = {
            'available':      { color:'#22c55e', bg:'rgba(34,197,94,0.12)',   label:'✦ Available' },
            'on project':     { color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  label:'◉ On Project' },
            'open to offers': { color:'#60a5fa', bg:'rgba(96,165,250,0.12)', label:'◎ Open to Offers' }
        };
        const key = (status||'').toLowerCase().trim();
        const cfg = map[key];
        if (!cfg) return '';
        return `<span class="avail-badge" style="color:${cfg.color};background:${cfg.bg};border-color:${cfg.color}20">${cfg.label}</span>`;
    }

    // --- Render Cards ---
    function renderCards(ops) {
        const grid = document.getElementById('operators-grid');
        const loading = document.getElementById('loading-state');
        const empty = document.getElementById('empty-state');
        loading.style.display = 'none';
        if (!ops.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
        empty.style.display = 'none';

        grid.innerHTML = ops.map((op, i) => {
            const bacs = calcBACS(op);
            const delay = initialRenderDone ? '0s' : `${i * 0.06}s`;
            const animClass = initialRenderDone ? '' : 'animate-in';
            return `<div class="op-card ${animClass}" data-index="${i}" style="animation-delay:${delay}">
                <div class="card-top">
                    <div class="card-avatar" data-photo="${op.photo}">
                        <span class="avatar-initials">${getInitials(op.name)}</span>
                    </div>
                    <div class="card-identity">
                        <div class="card-name">${op.name}</div>
                        <div class="card-trade">${op.trade}</div>
                        ${availabilityBadge(op.availability)}
                    </div>
                </div>
                <div class="card-meta">${[op.machines,op.hours].filter(Boolean).slice(0,2).map(t=>`<span class="card-tag">${t}</span>`).join('')}</div>
                <div class="card-bacs">
                    <span class="bacs-label">BACS Competence Score</span>
                    <span class="bacs-score">${bacs}</span>
                </div>
                <span class="card-cta">View Profile &amp; Proof →</span>
            </div>`;
        }).join('');

        // Lazy photo load with initials fallback
        grid.querySelectorAll('.card-avatar').forEach(av => {
            const url = av.dataset.photo;
            if (url) {
                const img = new Image();
                img.onload = () => {
                    av.style.backgroundImage = `url(${url})`;
                    av.style.backgroundSize = 'cover';
                    av.style.backgroundPosition = 'center';
                    av.querySelector('.avatar-initials').style.display = 'none';
                };
                img.src = url;
            }
        });

        grid.querySelectorAll('.op-card').forEach(card => {
            card.addEventListener('click', () => openModal(ops[parseInt(card.dataset.index)]));
        });
        initialRenderDone = true;
    }

    // --- Filter Chips with counts ---
    function buildChips(ops) {
        const trades = [...new Set(ops.map(o => o.trade))].sort();
        const container = document.getElementById('filter-chips');
        container.innerHTML = `<button class="chip active" data-trade="all">All Trades <span class="chip-count">${ops.length}</span></button>` +
            trades.map(t => {
                const count = ops.filter(o => o.trade === t).length;
                return `<button class="chip" data-trade="${t}">${t} <span class="chip-count">${count}</span></button>`;
            }).join('');
        container.querySelectorAll('.chip').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                activeTrade = btn.dataset.trade;
                applyFilters();
            });
        });
    }

    function applyFilters() {
        let filtered = operators;
        if (activeTrade !== 'all') filtered = filtered.filter(o => o.trade === activeTrade);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                o.name.toLowerCase().includes(s) ||
                o.trade.toLowerCase().includes(s) ||
                o.machines.toLowerCase().includes(s)
            );
        }
        renderCards(filtered);
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    // --- Open Modal ---
    function openModal(op) {
        const modal = document.getElementById('operator-modal');
        const bacs = calcBACS(op);

        // Video
        const videoWrap = document.getElementById('modal-video-wrap');
        const ytId = extractYouTubeId(op.video);
        if (ytId) {
            videoWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen loading="lazy"></iframe>`;
        } else if (op.video && (op.video.includes('drive.google.com') || op.video.endsWith('.mp4'))) {
            let src = op.video;
            if (src.includes('drive.google.com') && src.includes('/file/d/')) {
                const fid = src.match(/\/file\/d\/([^/]+)/);
                if (fid) src = `https://drive.google.com/file/d/${fid[1]}/preview`;
            }
            videoWrap.innerHTML = `<iframe src="${src}" allowfullscreen loading="lazy"></iframe>`;
        } else {
            videoWrap.innerHTML = `<div class="no-video"><span style="font-size:2.5rem">🎬</span><span>Video proof pending upload</span></div>`;
        }

        // Photo with fallback
        const photoEl = document.getElementById('modal-photo');
        photoEl.style.display = 'none';
        if (op.photo) {
            const img = new Image();
            img.onload = () => { photoEl.src = op.photo; photoEl.style.display = 'block'; };
            img.src = op.photo;
        }

        document.getElementById('modal-name').textContent = op.name;
        document.getElementById('modal-trade').textContent = op.trade;
        document.getElementById('modal-bacs-score').textContent = bacs + '/10';
        document.getElementById('modal-availability').innerHTML = availabilityBadge(op.availability);
        document.getElementById('modal-machines').textContent = op.machines || 'Not specified';
        document.getElementById('modal-hours').textContent = op.hours || 'Not specified';
        document.getElementById('modal-env').textContent = op.env || 'Not specified';
        document.getElementById('modal-steps').textContent = op.steps || 'Operational logic not yet submitted.';

        // WhatsApp — include trade
        const encodedName = encodeURIComponent(op.name);
        const encodedTrade = encodeURIComponent(op.trade);
        document.getElementById('btn-hire').href =
            `https://wa.me/${WA}?text=I%20want%20to%20negotiate%20a%20hire%20for%20${encodedName}%20(${encodedTrade}).%20My%20project%20budget%20is%20_%20and%20the%20timeline%20is%20_.`;

        // Dynamic maneuver fee
        const maneuverBtn = document.getElementById('btn-maneuver');
        const fee = (op.maneuver_fee||'').replace(/[^0-9,]/g,'').trim();
        if (fee) {
            maneuverBtn.innerHTML = `<span>🎥</span> Request Custom Maneuver — ₦${fee}`;
            maneuverBtn.href = `https://wa.me/${WA}?text=I%20want%20to%20commission%20a%20custom%20maneuver%20demo%20from%20${encodedName}%20(${encodedTrade}).%20I%20am%20ready%20to%20pay%20the%20%E2%82%A6${encodeURIComponent(fee)}%20coordination%20fee.`;
        } else {
            maneuverBtn.innerHTML = `<span>🎥</span> Request Maneuver Demo — Get Quote`;
            maneuverBtn.href = `https://wa.me/${WA}?text=I%20want%20to%20commission%20a%20custom%20maneuver%20demo%20from%20${encodedName}%20(${encodedTrade}).%20Please%20advise%20on%20the%20fee%20%E2%80%94%20I%20understand%20machine%20hire%20costs%20may%20apply.`;
        }

        document.getElementById('bacs-popover').classList.remove('visible');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('operator-modal').style.display = 'none';
        document.body.style.overflow = '';
        document.getElementById('modal-video-wrap').innerHTML = '';
        document.getElementById('bacs-popover').classList.remove('visible');
    }

    // --- Back to Top ---
    function initBackToTop() {
        const btn = document.getElementById('back-to-top');
        window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // --- Fetch with timeout ---
    function fetchWithTimeout(url, ms) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const msg = document.getElementById('loading-msg');
                if (msg) msg.textContent = 'Taking longer than usual — loading local data…';
                reject(new Error('Timeout'));
            }, ms);
            fetch(url).then(r => { clearTimeout(timer); resolve(r); }).catch(e => { clearTimeout(timer); reject(e); });
        });
    }

    // --- Init ---
    async function init() {
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('operator-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        document.getElementById('search-input').addEventListener('input', e => { searchTerm = e.target.value; applyFilters(); });

        // BACS popover toggle
        document.getElementById('bacs-info-btn').addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('bacs-popover').classList.toggle('visible');
        });
        document.addEventListener('click', e => {
            const pop = document.getElementById('bacs-popover');
            if (!pop.contains(e.target) && e.target.id !== 'bacs-info-btn') pop.classList.remove('visible');
        });

        initBackToTop();

        try {
            const res = await fetchWithTimeout(CSV_URL, 8000);
            const text = await res.text();
            const normalised = normalise(parseCSV(text));
            operators = normalised.length > 0 ? normalised : DEMO;
            if (normalised.length === 0) isDemoMode = true;
        } catch(e) {
            console.warn('CSV fetch failed, using demo data:', e);
            operators = DEMO; isDemoMode = true;
        }

        if (isDemoMode) document.getElementById('demo-banner').style.display = 'flex';

        countUp(document.getElementById('stat-operators'), operators.length, 900);
        countUp(document.getElementById('stat-trades'), new Set(operators.map(o => o.trade)).size, 900);
        buildChips(operators);
        renderCards(operators);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
