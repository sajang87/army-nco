(function () {
  'use strict';

  /* ═══════════════════════════════════════════════
     상태 변수
  ═══════════════════════════════════════════════ */
  var certs = [], profile = {}, activeCardIdx = -1,
    openCorpsName = null, openSpecId = null, lastRecs = [];

  /* ═══════════════════════════════════════════════
     화면 전환
  ═══════════════════════════════════════════════ */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    var el = document.getElementById(id);
    if (el) { el.classList.add('active'); window.scrollTo(0, 0); }
  }

  function showResultPage(show) {
    var nav = document.getElementById('stepsNav');
    var rp = document.getElementById('screenResult');
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    if (show) {
      rp.style.display = 'block';
      nav.style.display = 'none';
      window.scrollTo(0, 0);
    } else {
      rp.style.display = 'none';
      nav.style.display = 'flex';
    }
  }

  function setNav(n) {
    for (var i = 1; i <= 4; i++) {
      var b = document.getElementById('stepBtn' + i);
      b.classList.remove('active', 'done');
      if (i === n) b.classList.add('active');
      else if (i < n) b.classList.add('done');
    }
  }

  function goStep(n) { showScreen('screen' + n); setNav(n); }

  /* ═══════════════════════════════════════════════
     단계 이벤트
  ═══════════════════════════════════════════════ */
  document.getElementById('btn1').addEventListener('click', function () {
    var a = document.getElementById('inp_age').value.trim();
    var g = document.getElementById('inp_gender').value;
    document.getElementById('err1').style.display = 'none';
    if (!a || !g) { document.getElementById('err1').style.display = 'block'; return; }
    goStep(2);
  });

  document.getElementById('btn2').addEventListener('click', function () {
    var e = document.getElementById('inp_edu').value;
    var m = document.getElementById('inp_major').value;
    document.getElementById('err2').style.display = 'none';
    if (!e || !m) { document.getElementById('err2').style.display = 'block'; return; }
    goStep(3);
  });

  document.getElementById('btn2b').addEventListener('click', function () { goStep(1); });
  document.getElementById('btn3').addEventListener('click', function () { goStep(4); });
  document.getElementById('btn3b').addEventListener('click', function () { goStep(2); });

  document.getElementById('btn4').addEventListener('click', function () {
    var sel = document.querySelectorAll('.chip.selected');
    document.getElementById('err4').style.display = 'none';
    if (sel.length < 2) { document.getElementById('err4').style.display = 'block'; return; }
    var pers = [];
    sel.forEach(function (c) { pers.push(c.textContent.trim()); });
    profile = {
      name: document.getElementById('inp_name').value.trim() || '지원자',
      age: document.getElementById('inp_age').value.trim(),
      gender: document.getElementById('inp_gender').value,
      edu: document.getElementById('inp_edu').value,
      major: document.getElementById('inp_major').value,
      majorDetail: document.getElementById('inp_majorDetail').value,
      certs: certs.slice(),
      mbti: selectedMbti || '',
      personality: pers,
      extra: document.getElementById('inp_extra').value
    };
    showScreen('screenLoading');
    document.getElementById('stepsNav').style.display = 'none';
    setTimeout(buildResult, 2800);
  });

  document.getElementById('btn4b').addEventListener('click', function () { goStep(3); });
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.getElementById('addCertBtn').addEventListener('click', addCert);
  document.getElementById('certInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); addCert(); }
  });

  /* ═══════════════════════════════════════════════
     자격증 관리
  ═══════════════════════════════════════════════ */
  function addCert() {
    var v = document.getElementById('certInput').value.trim();
    if (!v) return;
    certs.push(v);
    document.getElementById('certInput').value = '';
    renderCerts();
  }

  window.removeCert = function (i) { certs.splice(i, 1); renderCerts(); };

  function renderCerts() {
    var h = '';
    certs.forEach(function (c, i) {
      h += '<div class="tag">' + c + '<span class="tag-x" onclick="removeCert(' + i + ')">✕</span></div>';
    });
    document.getElementById('certList').innerHTML = h;
  }

  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () { this.classList.toggle('selected'); });
  });

  /* ═══════════════════════════════════════════════
     MBTI 데이터 및 이벤트
  ═══════════════════════════════════════════════ */
  var selectedMbti = null;
  var MBTI_MAP = {
    'ISTJ': { desc: '체계적이고 책임감이 강한 현실주의자', specs: [['A101', 15], ['A301', 15], ['K412', 12]] },
    'ISFJ': { desc: '차분하고 헌신적인 수호자', specs: [['S101', 15], ['S301', 12], ['K201', 10]] },
    'INFJ': { desc: '통찰력 있는 선의의 옹호자', specs: [['A401', 15], ['S301', 15], ['T501', 10]] },
    'INTJ': { desc: '전략적이고 분석적인 전문가', specs: [['T703', 15], ['T502', 15], ['T303', 10]] },
    'ISTP': { desc: '과묵한 기술 장인, 만능 재주꾼', specs: [['T202', 15], ['K410', 15], ['T802', 12]] },
    'ISFP': { desc: '온화하고 현장 감각이 뛰어난 감성파', specs: [['A501', 12], ['K202', 10], ['S301', 10]] },
    'INFP': { desc: '이상주의적이고 공감 능력이 뛰어난 중재자', specs: [['S301', 15], ['A401', 12], ['S101', 10]] },
    'INTP': { desc: '논리적이고 호기심 많은 분석가', specs: [['T703', 15], ['T503', 12], ['K403', 10]] },
    'ESTP': { desc: '행동 지향적이고 적응력이 뛰어난 모험가', specs: [['T102', 15], ['A201', 15], ['T601', 10]] },
    'ESFP': { desc: '사교적이고 활동적인 자유로운 영혼', specs: [['A401', 12], ['A501', 12], ['K301', 10]] },
    'ENFP': { desc: '열정적이고 창의적인 활동가', specs: [['A401', 15], ['T506', 10], ['T501', 10]] },
    'ENTP': { desc: '새로운 도전을 즐기는 혁신가', specs: [['T703', 12], ['T506', 15], ['T502', 12]] },
    'ESTJ': { desc: '현실적이고 목표 지향적인 관리자', specs: [['T101', 15], ['A201', 12], ['A101', 12]] },
    'ESFJ': { desc: '배려심 많고 협력적인 조력자', specs: [['S101', 12], ['A101', 12], ['A401', 10]] },
    'ENFJ': { desc: '타인을 이끄는 언변능숙한 지도자', specs: [['A401', 15], ['S301', 12], ['T501', 12]] },
    'ENTJ': { desc: '결단력 있고 야심찬 야전 지휘관', specs: [['T101', 15], ['T201', 15], ['T402', 10]] }
  };

  document.querySelectorAll('.mbti-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (this.classList.contains('selected')) {
        this.classList.remove('selected');
        selectedMbti = null;
        document.getElementById('mbtiDesc').textContent = 'MBTI를 선택하면 유형별 추천 가점이 부여됩니다.';
        return;
      }
      document.querySelectorAll('.mbti-btn').forEach(function (b) { b.classList.remove('selected'); });
      this.classList.add('selected');
      selectedMbti = this.getAttribute('data-mbti');
      if (MBTI_MAP[selectedMbti]) {
        document.getElementById('mbtiDesc').textContent = MBTI_MAP[selectedMbti].desc + ' - 해당 특성에 맞는 병과에 가산점이 부여됩니다.';
      }
    });
  });

  /* ═══════════════════════════════════════════════
     병과 · 특기 데이터
  ═══════════════════════════════════════════════ */
  var CORPS = {
    '보병': { icon: '🪖', cat: '전투병과', subs: [{ id: 'T101', name: '일반보병', tag: '지상전투 핵심' }, { id: 'T102', name: '특전보병', tag: '특수전' }, { id: 'T103', name: '특임보병', tag: '특수임무' }] },
    '기갑': { icon: '🛡️', cat: '전투병과', subs: [{ id: 'T201', name: '전차승무', tag: '기계화 전투' }, { id: 'T202', name: '전차정비', tag: '기갑 정비' }, { id: 'T203', name: '장갑차', tag: '장갑차 운용' }] },
    '포병': { icon: '💥', cat: '전투병과', subs: [{ id: 'T301', name: '야전포병', tag: '장거리화력' }, { id: 'T302', name: '로켓포병', tag: '다연장로켓' }, { id: 'T303', name: '포병표적', tag: '표적획득' }] },
    '방공': { icon: '🎯', cat: '전투병과', subs: [{ id: 'T402', name: '방공무기 운용', tag: '대공방어' }] },
    '정보': { icon: '🔭', cat: '전투병과', subs: [{ id: 'T501', name: '인간정보', tag: 'HUMINT' }, { id: 'T502', name: '신호정보', tag: 'SIGINT' }, { id: 'T503', name: '영상정보', tag: 'IMINT' }, { id: 'T504', name: '방첩', tag: '방첩' }, { id: 'T506', name: '드론/UAV운용', tag: '무인항공' }] },
    '공병': { icon: '⚙️', cat: '전투병과', subs: [{ id: 'T601', name: '전투공병', tag: '장애물·도하' }, { id: 'T602', name: '시설공병', tag: '토목·건축' }, { id: 'T603', name: '공병장비및정비', tag: '공병장비' }] },
    '정보통신': { icon: '📡', cat: '전투병과', subs: [{ id: 'T701', name: '전술통신운용', tag: '전술통신' }, { id: 'T702', name: '특수통신운용', tag: '특수통신' }, { id: 'T703', name: '사이버,정보체계운용', tag: '사이버·IT' }] },
    '항공': { icon: '✈️', cat: '전투병과', subs: [{ id: 'T801', name: '항공운항', tag: '헬기 조종' }, { id: 'T802', name: '항공정비', tag: '항공 정비' }] },
    '화학': { icon: '☣️', cat: '기술병과', subs: [{ id: 'K101', name: '화생방작전', tag: 'CBRN 방호' }] },
    '병참': { icon: '📦', cat: '기술병과', subs: [{ id: 'K201', name: '물자보급', tag: '군수지원' }, { id: 'K202', name: '조리', tag: '급식·조리' }] },
    '수송': { icon: '🚛', cat: '기술병과', subs: [{ id: 'K301', name: '수송운용', tag: '차량수송' }, { id: 'K302', name: '이동관리', tag: '이동통제' }, { id: 'K303', name: '항만운용', tag: '항만지원' }] },
    '병기': {
      icon: '🔧', cat: '기술병과', subs: [
        { id: 'K401', name: '대공포정비', tag: '방공정비' }, { id: 'K402', name: '로켓정비', tag: '로켓정비' },
        { id: 'K403', name: '유도무기정비', tag: '유도무기' }, { id: 'K404', name: '총포정비', tag: '총포정비' },
        { id: 'K405', name: '광학및감시장비정비', tag: '광학·감시' }, { id: 'K406', name: '전차및장갑차정비', tag: '기갑정비' },
        { id: 'K407', name: '자주포정비', tag: '자주포' }, { id: 'K408', name: '전술통신정비', tag: '통신정비' },
        { id: 'K409', name: '특수통신정비', tag: '특수통신정비' }, { id: 'K410', name: '차량정비', tag: '차량정비' },
        { id: 'K411', name: '공병 중장비정비', tag: '공병 중장비정비' }, { id: 'K412', name: '탄약관리', tag: '탄약' },
        { id: 'K413', name: '장비수리부속관리', tag: '수리부속' }
      ]
    },
    '인사': { icon: '📋', cat: '행정병과', subs: [{ id: 'A101', name: '인사', tag: '인사행정' }] },
    '군사경찰': { icon: '🚔', cat: '행정병과', subs: [{ id: 'A201', name: '군사경찰', tag: '법집행·수사' }, { id: 'A202', name: '수사', tag: '범죄수사' }] },
    '재정': { icon: '💰', cat: '행정병과', subs: [{ id: 'A301', name: '재정', tag: '회계·예산' }] },
    '정훈': { icon: '📢', cat: '행정병과', subs: [{ id: 'A401', name: '정훈', tag: '정신교육·홍보' }, { id: 'A501', name: '군악', tag: '음악·의전' }] },
    '의무': { icon: '🏥', cat: '특수병과', subs: [{ id: 'S101', name: '의무', tag: '의료·간호' }] },
    '법무': { icon: '⚖️', cat: '특수병과', subs: [{ id: 'S201', name: '법무', tag: '군사법' }] },
    '군종': { icon: '🕊️', cat: '특수병과', subs: [{ id: 'S301', name: '군종', tag: '종교·정신전력' }] }
  };

  /* ═══════════════════════════════════════════════
     특기 상세 데이터
  ═══════════════════════════════════════════════ */
  var DETAILS = {
    'T101': { desc: '일반보병은 보병의 핵심 전투원으로 K2 소총 등 개인화기를 운용하며 지상전투 최전선에서 임무를 수행합니다. 간부는 분대장·소대장으로 병사를 직접 지휘합니다.', duties: ['분대 지휘 및 전투통제', '소총·기관총 운용', '야간·산악·시가지 전투', '전투훈련 기획·지도'], pros: '강인한 전투 리더십, 높은 자부심', cons: '체력 요구 수준이 매우 높음', youtube: 'https://www.youtube.com/results?search_query=육군+일반보병', ytTitle: '<span style=\"color: red;\">일반보병 훈련 영상</span>', match: 88 },
    'T102': { desc: '특전보병은 특수전 작전을 수행하는 고강도 훈련을 받은 정예 전투원입니다. 적 후방 침투·심리전·대테러 임무를 담당합니다.', duties: ['특수작전 수행', '적 후방 침투 및 정찰', '대테러 작전 지원', '특수전 교육 지도'], pros: '최고 엘리트 전투 자부심', cons: '극한의 체력 기준·혹독한 훈련', youtube: 'https://www.youtube.com/results?search_query=육군+특전보병', ytTitle: '특전보병 훈련 영상', match: 86 },
    'T103': { desc: '특임보병은 특수임무 수행을 위해 편성된 전문 전투원으로, 정밀타격·수색 등 특임 작전을 수행합니다.', duties: ['특수임무 작전 수행', '정밀 표적 타격 지원', '수색·정찰 임무', '부대 교육 지도'], pros: '전문 특임 역량, 엘리트 자부심', cons: '높은 체력·기술 기준', youtube: 'https://www.youtube.com/results?search_query=육군+특임보병', ytTitle: '특임보병 간부 영상', match: 84 },
    'T201': { desc: '전차승무는 K2 흑표·K1A2 등 최첨단 전차를 운용하는 기갑 핵심 특기입니다. 전차장·포수·조종수 역할을 맡아 기계화 전투를 이끕니다.', duties: ['전차 운용 및 사격통제', '전차 전술훈련 수행', '승무원 팀 지휘·훈련', '전차 장비 관리'], pros: '첨단 전차 전문가, 강한 자부심', cons: '협소한 탑승 공간, 혹서·혹한', youtube: 'https://www.youtube.com/results?search_query=육군+전차승무', ytTitle: '전차승무 간부 직무 영상', match: 85 },
    'T202': { desc: '전차정비는 K2·K1A2 등 전차 및 장갑차의 엔진·기체·사격통제장치를 정비·유지합니다.', duties: ['전차·장갑차 정기·수시 정비', '엔진·변속기·현수장치 정비', '사격통제장치 점검', '정비 기록 유지 및 관리'], pros: '기갑 정비 전문성, 전역 후 중장비 분야 연계', cons: '정밀 기술 요구, 야외 현장 작업 중심', youtube: 'https://www.youtube.com/results?search_query=육군+전차정비', ytTitle: '전차정비 간부 직무 영상', match: 82 },
    'T203': { desc: '장갑차는 K200·K21 등 장갑차를 운용하며 기계화보병과 함께 전투를 수행합니다.', duties: ['장갑차 운용 및 사격통제', '기계화 전술훈련 수행', '승무원 지휘·훈련', '장갑차 장비 관리'], pros: '기갑 전문성, 강한 자부심', cons: '협소한 탑승 공간, 혹서·혹한', youtube: 'https://www.youtube.com/results?search_query=육군+장갑차', ytTitle: '장갑차 간부 직무 영상', match: 82 },
    'T301': { desc: '야전포병은 K9 자주포·K55A1 등을 운용하여 원거리 화력 지원을 제공합니다. 정밀한 사격 제원 산출과 포대 운용이 핵심입니다.', duties: ['자주포·견인포 운용·사격', '사격 제원 계산 및 통제', '화력지원 계획 수립', '포병 장비 정비·관리'], pros: '화력 전문가로 성장, 첨단 포병 체계 운용', cons: '중량 장비 취급, 야외 근무 중심', youtube: 'https://www.youtube.com/results?search_query=육군+야전포병', ytTitle: '야전포병 간부 훈련 영상', match: 82 },
    'T302': { desc: '로켓포병은 다연장로켓(천무·구룡 등)을 운용하여 넓은 지역에 강력한 화력을 투사합니다.', duties: ['다연장로켓 운용·사격', '표적 선정 및 사격 계획', '로켓 장비 정비·관리', '전술 기동 수행'], pros: '강력한 화력 전문성, 첨단 장비 운용', cons: '대형 장비 운용, 야외 근무', youtube: 'https://www.youtube.com/results?search_query=육군+로켓포병', ytTitle: '로켓포병 간부 영상', match: 80 },
    'T303': { desc: '포병표적은 적 포병·미사일 위치를 탐지하고 아군 화력 지원을 위한 표적을 획득합니다.', duties: ['대포병레이더 운용', '적 포병·미사일 위치 탐지', '표적 획득 및 사격 제원 제공', '기상 측정 지원'], pros: '첨단 레이더 전문성', cons: '24시간 운용 근무 부담', youtube: 'https://www.youtube.com/results?search_query=육군+포병표적', ytTitle: '포병표적 간부 직무 영상', match: 79 },
    'T402': { desc: '방공무기 운용은 천마·비호·신궁 등 방공 무기체계로 적 항공기·드론·미사일을 요격합니다.', duties: ['방공 무기체계 운용·관리', '레이더 운용 및 표적 탐지', '방공 작전 수행', '방공 장비 정비 지원'], pros: '첨단 방공 무기 전문성, 미래 성장 분야', cons: '24시간 경계 근무 부담', youtube: 'https://www.youtube.com/results?search_query=육군+방공무기운용', ytTitle: '방공무기운용 간부 직무 영상', match: 81 },
    'T501': { desc: '인간정보(HUMINT)는 인적 네트워크를 통해 적 동향 첩보를 수집·분석합니다. 외국어 능력과 대인 커뮤니케이션이 핵심 역량입니다.', duties: ['인간정보 수집 및 운영', '첩보원 관리 및 운용', '정보 보고서 작성', '정보 교육 지원'], pros: '고급 분석 능력 개발, 외국어 활용', cons: '높은 보안 의식·비밀 취급 요구', youtube: 'https://www.youtube.com/results?search_query=육군+인간정보', ytTitle: '인간정보 간부 직무 영상', match: 84 },
    'T502': { desc: '신호정보(SIGINT)는 전자·통신 신호를 수집·분석하여 적의 의도와 능력을 파악합니다.', duties: ['신호 정보 수집 및 분석', '전자전 장비 운용', '통신 감청 및 분석', '신호 정보 보고서 작성'], pros: '전자전·IT 전문성, 희소 분야', cons: '전문 기술 지속 습득 필요', youtube: 'https://www.youtube.com/results?search_query=육군+신호정보', ytTitle: '신호정보 간부 직무 영상', match: 86 },
    'T503': { desc: '영상정보(IMINT)는 위성·항공·드론 영상을 분석하여 전장 상황을 파악합니다.', duties: ['항공·위성·드론 영상 분석', '전장 상황 판독 및 보고', '표적 좌표 식별', '영상 정보 보고서 작성'], pros: '영상 분석 전문성, 첨단 장비 운용', cons: '집중력 요구, 높은 보안 의식 필요', youtube: 'https://www.youtube.com/results?search_query=육군+영상정보', ytTitle: '영상정보 간부 직무 영상', match: 83 },
    'T504': { desc: '방첩은 적 정보기관의 침투·공작을 탐지하고 군 보안을 유지합니다.', duties: ['방첩 수사 및 보안 활동', '군 보안 위반 탐지·조사', '보안 교육 실시', '정보 보호 관리'], pros: '보안·수사 전문성 개발', cons: '높은 보안 의식·책임감 요구', youtube: 'https://www.youtube.com/results?search_query=육군+방첩', ytTitle: '방첩 간부 직무 영상', match: 80 },
    'T506': { desc: '드론/UAV운용은 군사용 무인항공기를 운용하여 전장 정찰·목표 탐지·전투효과 평가를 수행합니다. 드론 기술 발전으로 미래 핵심 특기입니다.', duties: ['군용 드론(UAV) 조종·운용', '항공 영상정보 수집·분석', '드론 정비·시스템 점검', '전술 정찰·타격 유도 지원'], pros: '미래 첨단 분야, 드론 자격증 연계', cons: '기상 영향 큼, 복잡한 운용 절차', youtube: 'https://www.youtube.com/results?search_query=육군+드론+UAV운용', ytTitle: '드론/UAV운용 간부 영상', match: 91 },
    'T601': { desc: '전투공병은 지뢰 매설·제거, 장애물 설치, 교량 구축, 도하작전 지원 등 전투 지원 임무를 수행합니다.', duties: ['지뢰·장애물 설치 및 제거', '폭파 작전 및 교량 구축', '도하 장비 운용', '전투 기동로 개척·차단'], pros: '고도 전문 기술, 강한 자부심', cons: '위험 임무 빈도 높음', youtube: 'https://www.youtube.com/results?search_query=육군+전투공병', ytTitle: '전투공병 간부 훈련 영상', match: 83 },
    'T602': { desc: '시설공병은 군사시설 건설·도로·교량 공사·야전 진지 구축 등 군 기반시설을 조성합니다. 토목·건축 전공자에게 특히 유리합니다.', duties: ['군사시설 건설·유지보수', '야전 진지·장애물 구축', '도로·교량 공사 지원', '시설 안전점검 및 관리'], pros: '전공 직접 활용, 건설 기술 축적', cons: '야외 현장 작업 중심, 기후 영향', youtube: 'https://www.youtube.com/results?search_query=육군+시설공병', ytTitle: '시설공병 간부 소개 영상', match: 88 },
    'T603': { desc: '공병장비및정비는 굴착기·불도저·부교 등 공병 전문 장비를 운용·정비합니다.', duties: ['공병 전문 장비 운용', '장비 정기·수시 정비', '진지 구축·재해 복구 지원', '장비 안전 점검 관리'], pros: '중장비 전문성, 전역 후 건설기계 분야 연계', cons: '야외 현장 작업 중심', youtube: 'https://www.youtube.com/results?search_query=육군+공병장비정비', ytTitle: '공병장비및정비 간부 영상', match: 80 },
    'T701': { desc: '전술통신운용은 군 전술통신망·무선·유선 통신장비를 운용합니다. 전장에서 지휘관의 통신을 보장하는 핵심 지원 특기입니다.', duties: ['전술통신망 구성·운용', '무선·유선 통신장비 운용', '통신 보안 관리', '통신 교육 실시'], pros: '통신·전기 전문성 개발', cons: '전방 보안 책임, 야외 운용 근무', youtube: 'https://www.youtube.com/results?search_query=육군+전술통신운용', ytTitle: '전술통신운용 간부 직무 영상', match: 80 },
    'T702': { desc: '특수통신운용은 위성·암호통신 등 특수 통신 장비를 운용합니다.', duties: ['위성·암호 통신장비 운용', '특수 통신망 구성·운용', '통신 보안 관리', '특수 통신 교육 지원'], pros: '특수통신 전문성, 희소 분야', cons: '고도의 보안 의식·전문 기술 필요', youtube: 'https://www.youtube.com/results?search_query=육군+특수통신운용', ytTitle: '특수통신운용 간부 영상', match: 78 },
    'T703': { desc: '사이버,정보체계운용은 군 전산망·지휘통제체계(C4I)·사이버 방어 작전을 수행합니다. IT 전문지식을 군에서 직접 활용하는 최첨단 특기입니다.', duties: ['군 전산망·사이버 방어 운용', '지휘통제체계(C4I) 운용', '사이버 위협 탐지·대응', '정보보안 체계 관리'], pros: '최첨단 IT·보안 분야, 전역 후 경력 우수', cons: '고도 기술 지속 습득 필요', youtube: 'https://www.youtube.com/results?search_query=육군+사이버정보체계운용', ytTitle: '사이버,정보체계운용 간부 영상', match: 95 },
    'T801': { desc: '항공운항은 UH-60 블랙호크·AH-64D 아파치 등 육군 헬기를 직접 조종하여 전투 임무를 수행합니다.', duties: ['육군 헬기 조종·비행 임무', '전술 항공 작전 수행', '항공 정찰·화력 지원', '비행 교육 지도'], pros: '항공 조종사 전문성, 높은 자부심', cons: '장기 훈련 과정, 높은 신체 기준', youtube: 'https://www.youtube.com/results?search_query=육군+항공운항', ytTitle: '항공운항 간부 직무 영상', match: 87 },
    'T802': { desc: '항공정비는 AH-64D 아파치·UH-60 블랙호크 등 육군 헬기를 정비·유지합니다.', duties: ['육군 헬기 정기·비정기 정비', '엔진·기체·전자장비 점검', '부품 교환·결함 수리', '비행 전후 안전점검'], pros: '항공정비 전문성, 민간 항공정비사 자격 연계', cons: '높은 집중력·정밀 기술 요구', youtube: 'https://www.youtube.com/results?search_query=육군+항공정비', ytTitle: '항공정비 간부 소개 영상', match: 89 },
    'K101': { desc: '화생방작전은 화학·생물·방사선·핵(CBRN) 위협으로부터 부대를 보호하고 오염 제독 작전을 수행합니다.', duties: ['화생방 위협 탐지·식별', '오염 제독 작전 수행', '방호 장비 관리·운용', '화생방 교육 실시'], pros: '화학 전문성 직접 활용', cons: '유해물질 노출 위험 관리 중요', youtube: 'https://www.youtube.com/results?search_query=육군+화생방작전', ytTitle: '화생방작전 간부 직무 영상', match: 82 },
    'K201': { desc: '물자보급은 부대의 식량·피복·장비·연료 등 군수 물자를 조달·분배·관리합니다.', duties: ['군수 물자 조달·배분', '창고 관리 및 재고 통제', '보급 계획 수립', '물자 손망실 처리'], pros: '물류·경영 전문성, 안정적 근무', cons: '재고 관리 책임 부담', youtube: 'https://www.youtube.com/results?search_query=육군+물자보급', ytTitle: '물자보급 간부 직무 소개', match: 79 },
    'K202': { desc: '조리는 부대 장병의 급식을 책임지는 특기로, 대량 조리 기술과 식품 위생 관리를 담당합니다.', duties: ['부대 급식 조리 및 관리', '식품 위생 관리', '급식 계획 수립', '조리 교육 지원'], pros: '조리 자격증 활용, 안정적 근무', cons: '이른 기상, 반복적 업무', youtube: 'https://www.youtube.com/results?search_query=육군+조리+간부', ytTitle: '조리 간부 직무 소개', match: 72 },
    'K301': { desc: '수송운용은 군용 대형차량(5톤 카고·탄약수송차 등)을 운전하고 차량 운행을 통합 관리합니다.', duties: ['군용 대형차량 운전·관리', '차량 정비·안전점검', '병력·물자 수송 지원', '운전 교육 실시'], pros: '운전면허 자격 직접 활용', cons: '장거리 운행 피로, 야간 운행 빈번', youtube: 'https://www.youtube.com/results?search_query=육군+수송운용', ytTitle: '수송운용 간부 직무 영상', match: 78 },
    'K302': { desc: '이동관리는 부대 이동 계획 수립·도로 통제·수송 자원 배정 등 군 이동 통제를 담당합니다.', duties: ['부대 이동 계획 수립', '도로 통제 및 수송 자원 배정', '이동 통제소 운용', '이동 제원 분석·보고'], pros: '행정·계획 전문성', cons: '전시 이동 시 고강도 근무', youtube: 'https://www.youtube.com/results?search_query=육군+이동관리', ytTitle: '이동관리 간부 직무 영상', match: 76 },
    'K303': { desc: '항만운용은 군수 물자의 해상 하역·적재·보관 등 항만 활동을 지원합니다.', duties: ['항만 하역·적재 작업 관리', '항만 통제 및 보안', '수송 선박 지원', '항만 물자 보관 관리'], pros: '항만·물류 전문성', cons: '해안 지역 근무, 기상 영향', youtube: 'https://www.youtube.com/results?search_query=육군+항만운용', ytTitle: '항만운용 간부 직무 영상', match: 70 },
    'K401': { desc: '대공포정비는 비호·발칸 등 대공포 무기체계를 정비·유지합니다.', duties: ['대공포 무기체계 정비', '포신·사격통제장치 점검', '정비 기록 관리', '정비 교육 지원'], pros: '방공 정비 전문성', cons: '정밀 기술 요구', youtube: 'https://www.youtube.com/results?search_query=육군+대공포정비', ytTitle: '대공포정비 간부 영상', match: 76 },
    'K402': { desc: '로켓정비는 다연장로켓(천무·구룡) 발사대와 탄약을 정비·관리합니다.', duties: ['다연장로켓 발사대 정비', '로켓 탄약 관리·취급', '차량 추진체 정비', '정비 기록 관리'], pros: '로켓 무기체계 전문성', cons: '위험물 취급 주의 필요', youtube: 'https://www.youtube.com/results?search_query=육군+로켓정비', ytTitle: '로켓정비 간부 영상', match: 75 },
    'K403': { desc: '유도무기정비는 미사일·유도탄 등 유도 무기체계를 정비·시험합니다. 전자·정밀기계 전공자에게 유리합니다.', duties: ['유도 무기체계 정비·시험', '전자 회로·센서 점검', '유도 장치 교정·조정', '정비 기록 및 기술 관리'], pros: '첨단 유도무기 전문성, 희소 분야', cons: '고도의 정밀 기술 요구', youtube: 'https://www.youtube.com/results?search_query=육군+유도무기정비', ytTitle: '유도무기정비 간부 영상', match: 80 },
    'K404': { desc: '총포정비는 소화기·곡사포·자주포 등 각종 총포류 무기를 정비·수리합니다.', duties: ['소화기·화포 정기 정비', '부품 교환·수리', '무기 성능 검사', '정비 교육 지원'], pros: '총포 정비 전문성', cons: '정밀 기계 기술 요구', youtube: 'https://www.youtube.com/results?search_query=육군+총포정비', ytTitle: '총포정비 간부 영상', match: 74 },
    'K405': { desc: '광학및감시장비정비는 열상관측장비·야시경·감시카메라 등 광학·감시 장비를 정비합니다.', duties: ['광학·감시 장비 정비', '렌즈·광학계 조정', '전자·영상 회로 점검', '정비 기록 관리'], pros: '광학 전자 전문성', cons: '정밀 작업 요구', youtube: 'https://www.youtube.com/results?search_query=육군+광학감시장비정비', ytTitle: '광학및감시장비정비 간부 영상', match: 78 },
    'K406': { desc: '전차및장갑차정비는 K2·K1A2 전차와 K21·K200 장갑차를 정비·유지합니다.', duties: ['전차·장갑차 엔진·변속기 정비', '현수장치·차체 정비', '사격통제장치 점검', '정비 기록 유지'], pros: '기갑 정비 전문성, 중장비 기술 축적', cons: '중량 장비 작업, 야외 현장 중심', youtube: 'https://www.youtube.com/results?search_query=육군+전차장갑차정비', ytTitle: '전차및장갑차정비 간부 영상', match: 83 },
    'K407': { desc: '자주포정비는 K9 자주포·K55A1 등 자주포 계열 장비를 정비합니다.', duties: ['자주포 엔진·포탑·사격통제 정비', '자주포 전기·유압 계통 점검', '부품 교환·수리', '정비 기록 관리'], pros: '자주포 전문 정비 기술', cons: '중량 장비 작업', youtube: 'https://www.youtube.com/results?search_query=육군+자주포정비', ytTitle: '자주포정비 간부 영상', match: 77 },
    'K408': { desc: '전술통신정비는 전술통신 장비(무전기·통신기·중계장비 등)를 정비·수리합니다.', duties: ['전술통신 장비 정기·수시 정비', '회로 점검·납땜·수리', '통신 장비 성능 시험', '정비 기록 관리'], pros: '통신·전자 정비 전문성', cons: '정밀 전자 회로 기술 요구', youtube: 'https://www.youtube.com/results?search_query=육군+전술통신정비', ytTitle: '전술통신정비 간부 영상', match: 78 },
    'K409': { desc: '특수통신정비는 위성통신·암호장비 등 특수 통신 장비를 정비합니다.', duties: ['위성·암호 통신장비 정비', '특수 회로 점검·수리', '장비 성능 시험·교정', '정비 기록 관리'], pros: '특수통신 전문성, 희소 분야', cons: '고도의 기술 요구', youtube: 'https://www.youtube.com/results?search_query=육군+특수통신정비', ytTitle: '특수통신정비 간부 영상', match: 76 },
    'K410': { desc: '차량정비는 군용 트럭·지프·특수차량 등 각종 차량을 정비·유지합니다.', duties: ['군용 차량 정기·수시 정비', '엔진·변속기·제동장치 점검', '부품 교환·수리', '정비 기록 관리'], pros: '자동차 정비 자격 활용, 전역 후 연계 용이', cons: '야외 현장 작업 중심', youtube: 'https://www.youtube.com/results?search_query=육군+차량정비', ytTitle: '차량정비 간부 직무 영상', match: 80 },
    'K411': { desc: '공병 중장비정비는 굴착기·불도저·부교 등 공병 전문 장비를 정비합니다.', duties: ['공병 건설 장비 정비·유지', '유압·동력 계통 점검', '부품 교환·수리', '정비 기록 관리'], pros: '건설기계 전문성, 전역 후 건설업 연계', cons: '야외 현장 작업 중심', youtube: 'https://www.youtube.com/results?search_query=육군+공병중장비정비', ytTitle: '공병 중장비정비 간부 영상', match: 78 },
    'K412': { desc: '탄약관리는 각종 탄약·폭발물의 수령·저장·불출·폐기를 안전하게 관리합니다.', duties: ['탄약 수령·저장·불출 관리', '탄약 안전 점검 및 저장 관리', '탄약 수불 기록 유지', '탄약 처리 교육 지원'], pros: '탄약 전문 지식, 안전 전문가', cons: '위험물 취급, 높은 책임감 요구', youtube: 'https://www.youtube.com/results?search_query=육군+탄약관리', ytTitle: '탄약관리 간부 직무 영상', match: 75 },
    'K413': { desc: '장비수리부속관리는 각종 군 장비의 수리부속(부품)을 조달·저장·분배·관리합니다.', duties: ['수리부속 조달·저장·분배', '재고 관리 및 수불 기록', '부품 수요 예측 및 청구', '창고 관리'], pros: '물류 전문성, 전역 후 물류 분야 연계', cons: '재고 관리 책임 부담', youtube: 'https://www.youtube.com/results?search_query=육군+수리부속관리', ytTitle: '장비수리부속관리 간부 영상', match: 74 },
    'A101': { desc: '인사 특기는 장병 인사 기록 관리·전입출 처리·포상·징계 행정 등 부대 인사 전반을 담당합니다.', duties: ['장병 인사 기록 작성·관리', '전입·전출·전역 행정 처리', '포상·징계 서류 관리', '인사 통계 및 보고'], pros: '행정 전문성 개발, 안정적 근무', cons: '반복적 문서 업무', youtube: 'https://www.youtube.com/results?search_query=육군+인사+간부', ytTitle: '인사 간부 직무 소개', match: 77 },
    'A201': { desc: '군사경찰은 군내 법질서 유지·교통통제·포로 관리·범죄 예방 활동을 담당합니다.', duties: ['군내 법질서 유지 활동', '교통통제 및 사고조사', '포로 관리', '경호·경비 작전 수행'], pros: '법집행 경험, 전역 후 경찰관 시험 연계', cons: '야간근무 빈번, 업무 스트레스', youtube: 'https://www.youtube.com/results?search_query=육군+군사경찰+간부', ytTitle: '군사경찰 간부 직무 영상', match: 84 },
    'A202': { desc: '수사 특기는 군내 범죄를 수사·처리하고 법적 절차를 진행합니다.', duties: ['군내 범죄 수사 및 처리', '증거 수집 및 피의자 조사', '수사 기록 작성', '수사 교육 지원'], pros: '수사 전문성, 전역 후 경찰·검찰 연계', cons: '수사 업무 스트레스', youtube: 'https://www.youtube.com/results?search_query=육군+수사+간부', ytTitle: '수사 간부 직무 영상', match: 80 },
    'A301': { desc: '재정 특기는 부대의 예산 집행·급여 관리·회계 처리 등 군 재정 업무 전반을 담당합니다.', duties: ['부대 예산 편성·집행', '장병 급여·복지비 지급', '회계 결산·감사 대응', '재정 교육 실시'], pros: '경영 전공 직접 활용, 안정적 실내 근무', cons: '감사 기간 집중 업무', youtube: 'https://www.youtube.com/results?search_query=육군+재정+간부', ytTitle: '재정 간부 직무 소개', match: 80 },
    'A401': { desc: '정훈 특기는 장병 정신전력 교육·대적관 함양·부대 문화 행사 기획 및 홍보 업무를 담당합니다.', duties: ['정신전력 교육 기획·실시', '대적관·역사·안보 교육', '부대 문화 행사 운영', '홍보물·SNS 콘텐츠 제작'], pros: '강의·교육·홍보 전문성', cons: '콘텐츠 지속 개발 필요', youtube: 'https://www.youtube.com/results?search_query=육군+정훈+간부', ytTitle: '정훈 간부 직무 영상', match: 78 },
    'A501': { desc: '군악 특기는 군 의식행사 연주·부대 사기 고양·음악 교육을 담당합니다.', duties: ['의식행사 연주 임무 수행', '군악대 지휘 및 연습', '부대 행사 음악 지원', '장병 음악 교육'], pros: '음악 전공 직접 활용, 활동적 근무', cons: '행사 시 초과근무 빈번', youtube: 'https://www.youtube.com/results?search_query=육군+군악+간부', ytTitle: '군악 간부 직무 영상', match: 73 },
    'S101': { desc: '의무 특기는 군 병원·의무대에서 환자 간호·진료 지원·전상자 처치·예방의료를 수행합니다.', duties: ['입원환자 진료·간호·처치', '수술실·응급실 지원', '전상자 응급처치', '예방의료 활동 및 보건 교육'], pros: '의료 전문 자격 활용, 안정적 근무', cons: '야간 당직·응급 근무 빈번', youtube: 'https://www.youtube.com/results?search_query=육군+의무+간부', ytTitle: '의무 간부 직무 영상', match: 93 },
    'S201': { desc: '법무 특기는 군 법률 상담·군사 재판 지원·법규 교육 등 군사 법무 행정 업무를 담당합니다.', duties: ['군 법률 상담 지원', '군사 재판 관련 행정', '법규 교육 기획·실시', '군사 법규 자료 관리'], pros: '법률 전문성 심화, 전문직 경로', cons: '전문 지식 지속 갱신 필요', youtube: 'https://www.youtube.com/results?search_query=육군+법무+간부', ytTitle: '법무 간부 직무 영상', match: 76 },
    'S301': { desc: '군종 특기는 장병의 정신 건강과 신앙 생활을 지원하고 종교 행사를 주관합니다.', duties: ['종교 행사 기획·진행', '장병 종교 상담 및 심리 지원', '종교 교육 실시', '부대 문화 행사 지원'], pros: '봉사 보람, 장병 정신건강 기여', cons: '종교 지도자 자격 필수', youtube: 'https://www.youtube.com/results?search_query=육군+군종+간부', ytTitle: '군종 간부 직무 소개', match: 72 }
  };

  /* ═══════════════════════════════════════════════
     상세 조회
  ═══════════════════════════════════════════════ */
  function getDetail(id) {
    var d = DETAILS[id];
    if (!d) return { desc: '해당 특기는 육군의 주요 병과 중 하나로 전문 군사 기술과 리더십을 발휘할 수 있는 간부 직위입니다.', duties: ['전문 분야 업무 수행', '부대 지원 임무', '후배 병사 교육·지도', '장비 운용·관리'], pros: '전문성 개발, 안정적 직업', cons: '강도 높은 훈련·근무', youtube: 'https://www.youtube.com/results?search_query=육군+간부', ytTitle: '육군 간부 생활 영상', match: 75 };
    return d;
  }

  /* ═══════════════════════════════════════════════
     추천 알고리즘
  ═══════════════════════════════════════════════ */
  function recommend(p) {
    var scores = {};
    for (var corps in CORPS) {
      var subs = CORPS[corps].subs;
      for (var i = 0; i < subs.length; i++) {
        scores[subs[i].id] = { corps: corps, sub: subs[i], score: 0, reasons: [], majorMatch: false, certMatch: false };
      }
    }

    function add(id, pts, reason, isMajor, isCert) {
      if (!scores[id]) return;
      scores[id].score += pts;
      if (isMajor) scores[id].majorMatch = true;
      if (isCert) scores[id].certMatch = true;
      if (reason && scores[id].reasons.indexOf(reason) === -1) scores[id].reasons.push(reason);
    }

    var m = p.major;
    var pers = p.personality.join(' ');
    var cs = p.certs.join(' ').toLowerCase();

    /* ── 전공 매핑 ── */
    var MAJOR_MAP = {
      '컴퓨터·정보통신': [['T703', 80, 'IT·정보통신 전공 직결'], ['T502', 40, '전자·통신 전공'], ['T701', 30, '통신 전공'], ['K408', 20, '전기전자 연관']],
      '전기·전자공학': [['K408', 75, '전기전자 전공 직결'], ['K409', 60, '전기전자 전공'], ['T701', 35, '통신 전공'], ['K403', 30, '전자 전공'], ['T703', 20, 'IT 연관']],
      '기계공학': [['K406', 75, '기계공학 전공 직결'], ['K410', 60, '기계·자동차 전공'], ['T603', 50, '공병 장비 전공'], ['K411', 40, '건설기계 연관'], ['T602', 20, '건설 연관']],
      '항공·드론': [['T802', 80, '항공 전공 직결'], ['T506', 80, '드론 전공 직결'], ['T801', 55, '항공 전공']],
      '화학·화공': [['K101', 85, '화학·화공 전공 직결'], ['K402', 30, '이공계 연관']],
      '토목·건축': [['T602', 80, '토목·건축 전공 직결'], ['T603', 50, '공병장비 연관'], ['K411', 40, '건설기계 연관']],
      '자동차공학': [['K410', 80, '자동차공학 전공 직결'], ['K406', 55, '기계·자동차 전공'], ['T603', 25, '장비 연관']],
      '간호·보건': [['S101', 90, '간호·보건 전공 직결']],
      '응급구조': [['S101', 90, '응급구조 전공 직결']],
      '체육·스포츠': [['T101', 70, '체육 전공'], ['T102', 60, '체육·특전 전공'], ['T103', 50, '체육 전공'], ['T201', 30, '체력 중심']],
      '외국어': [['T501', 80, '외국어 전공 직결'], ['T502', 35, '외국어·통신 전공'], ['A401', 30, '홍보·교육 연관']],
      '경영·경제': [['A301', 75, '경영·경제 전공 직결'], ['K201', 55, '물류·경영 전공'], ['K413', 40, '물류·경영 전공'], ['K302', 25, '이동관리 연관']],
      '행정·법학': [['S201', 75, '법학 전공 직결'], ['A202', 65, '법학·수사 전공'], ['A101', 50, '행정 전공']],
      '심리학': [['S301', 65, '심리·상담 전공'], ['A401', 50, '교육·심리 전공'], ['A101', 25, '인사 연관']],
      '음악·예술': [['A501', 90, '음악·예술 전공 직결'], ['A401', 35, '홍보·예술 연관']],
      '생물·의생명': [['K101', 60, '생물·화학 전공'], ['S101', 40, '의생명 연관']],
      '물리·수학': [['T303', 55, '이공계·물리 전공'], ['T502', 45, '이공계 전공'], ['K403', 40, '이공계 전공'], ['T701', 25, '통신 연관']],
      '사회복지': [['S301', 70, '사회복지 전공 직결'], ['A401', 45, '교육·복지 전공'], ['A101', 25, '행정 연관']],
      '상업·유통': [['K201', 70, '물류·유통 전공 직결'], ['A301', 50, '상경계 전공'], ['K413', 40, '수리부속 관리 연관'], ['K302', 25, '이동관리 연관']],
      '언론·미디어': [['A401', 75, '정훈·홍보 전공 직결'], ['T501', 30, '커뮤니케이션 연관']],
      '교육학': [['A401', 65, '교육 전공'], ['S301', 40, '상담·교육 연관'], ['A101', 25, '행정 연관']],
      '기타': [['T101', 30, '전투 기본'], ['A101', 20, '행정'], ['K201', 20, '보급']]
    };
    if (MAJOR_MAP[m]) {
      for (var mi = 0; mi < MAJOR_MAP[m].length; mi++) {
        add(MAJOR_MAP[m][mi][0], MAJOR_MAP[m][mi][1], MAJOR_MAP[m][mi][2], true, false);
      }
    }

    /* ── 자격증 매핑 ── */
    var CERT_MAP = [
      [['간호사', '간호', 'nurse'], [['S101', 90, '간호사 자격증 보유']]],
      [['간호조무사'], [['S101', 75, '간호조무사 자격증 보유']]],
      [['응급구조사', '응급구조', 'emt'], [['S101', 80, '응급구조사 자격증 보유']]],
      [['의료기사', '임상병리'], [['S101', 55, '의료 관련 자격증 보유']]],
      [['정보처리기사', '정보처리산업기사', '정보처리'], [['T703', 70, '정보처리 자격증 보유'], ['T701', 35, '통신 연관']]],
      [['네트워크관리사', '네트워크'], [['T703', 55, '네트워크 자격증 보유'], ['T701', 30, '통신 연관']]],
      [['정보보안기사', '정보보안'], [['T703', 65, '정보보안 자격증 보유']]],
      [['리눅스마스터', '리눅스'], [['T703', 50, '리눅스 자격증 보유']]],
      [['전기기사', '전기산업기사'], [['K408', 65, '전기기사 자격증 보유'], ['T701', 25, '통신 연관']]],
      [['전기기능사'], [['K408', 50, '전기기능사 자격증 보유']]],
      [['전자기기기능사', '전자기기'], [['K408', 45, '전자기기 자격증 보유'], ['K409', 40, '전기전자 연관']]],
      [['자동차정비기사', '자동차정비산업기사', '자동차정비'], [['K410', 80, '자동차정비 자격증 보유'], ['K406', 35, '기계 연관']]],
      [['자동차정비기능사'], [['K410', 65, '자동차정비 자격증 보유']]],
      [['건설기계기사', '건설기계산업기사', '건설기계'], [['K411', 75, '건설기계 자격증 보유'], ['T602', 35, '공병 연관']]],
      [['건설기계정비기능사', '건설기계정비'], [['K411', 60, '건설기계정비 자격증 보유']]],
      [['기계정비기능사', '기계정비'], [['K406', 55, '기계정비 자격증 보유'], ['K410', 35, '차량정비 연관']]],
      [['용접기능사', '용접'], [['T601', 50, '용접 자격증 보유'], ['T602', 40, '시설공병 연관']]],
      [['조종사', '항공기조종'], [['T801', 85, '조종 자격증 보유'], ['T506', 40, '드론 연관']]],
      [['항공정비사', '항공정비기사', '항공정비'], [['T802', 85, '항공정비 자격증 보유']]],
      [['무인동력비행장치', '드론자격', '드론'], [['T506', 85, '드론 자격증 보유'], ['T802', 20, '항공 연관']]],
      [['위험물산업기사', '위험물기능사', '위험물'], [['K101', 70, '위험물 자격증 보유'], ['K402', 35, '로켓정비 연관'], ['K412', 30, '탄약관리 연관']]],
      [['화학분석기사', '화학분석기능사', '화학분석'], [['K101', 65, '화학분석 자격증 보유']]],
      [['토목기사', '토목산업기사', '토목기능사'], [['T602', 75, '토목 자격증 보유'], ['T603', 35, '공병장비 연관']]],
      [['건축기사', '건축산업기사'], [['T602', 65, '건축 자격증 보유']]],
      [['대형운전면허', '대형1종', '1종대형'], [['K301', 85, '대형면허 보유'], ['K302', 30, '이동관리 연관']]],
      [['1종보통', '운전면허1종'], [['K301', 55, '1종보통 면허 보유'], ['K410', 20, '차량 연관']]],
      [['2종보통', '운전면허'], [['K301', 30, '운전면허 보유']]],
      [['toeic', '토익'], [['T501', 60, '영어(토익) 보유'], ['A401', 25, '홍보 연관']]],
      [['토플', 'toefl'], [['T501', 65, '영어(토플) 보유']]],
      [['jlpt', '일본어능력시험'], [['T501', 55, '일본어능력 보유']]],
      [['hsk', '중국어'], [['T501', 55, '중국어능력 보유']]],
      [['조리기능사', '조리산업기사', '조리기사', '한식', '양식', '중식', '일식', '제과', '제빵'], [['K202', 85, '조리 자격증 보유']]],
      [['회계사', '공인회계사', 'cpa'], [['A301', 75, '회계사 자격증 보유']]],
      [['세무사'], [['A301', 65, '세무사 자격증 보유']]],
      [['전산회계', 'erp'], [['A301', 50, '전산회계 자격증 보유'], ['A101', 25, '행정 연관']]],
      [['물류관리사'], [['K201', 70, '물류관리사 자격증 보유'], ['K302', 30, '이동관리 연관']]],
      [['경찰공무원', '경찰'], [['A202', 65, '경찰 관련 자격 보유'], ['A201', 50, '군사경찰 연관']]],
      [['무도', '태권도', '유도', '검도', '합기도', '주짓수'], [['A201', 55, '무도 자격증 보유'], ['T101', 35, '전투 연관']]],
      [['음악', '피아노', '바이올린', '플루트', '클라리넷', '색소폰', '트럼펫', '타악기', '지휘'], [['A501', 85, '음악 자격·전공 보유']]],
      [['사회복지사'], [['S301', 70, '사회복지사 자격증 보유'], ['A401', 30, '교육·복지 연관']]]
    ];

    for (var ci = 0; ci < CERT_MAP.length; ci++) {
      var keywords = CERT_MAP[ci][0];
      var targets = CERT_MAP[ci][1];
      var matched = false;
      for (var ki = 0; ki < keywords.length; ki++) {
        if (cs.indexOf(keywords[ki].toLowerCase()) !== -1) { matched = true; break; }
      }
      if (matched) {
        for (var cj = 0; cj < targets.length; cj++) {
          add(targets[cj][0], targets[cj][1], targets[cj][2], false, true);
        }
      }
    }

    /* ── 전문특기 게이트 패널티 ── */
    var GATE = { 'S101': 1, 'A501': 1, 'K202': 1, 'S201': 1, 'T801': 1, 'T802': 1, 'T506': 1 };
    for (var sid in GATE) {
      if (scores[sid] && !scores[sid].majorMatch && !scores[sid].certMatch) {
        scores[sid].score = Math.max(0, scores[sid].score - 100);
      }
    }

    /* ── 성격 보정 ── */
    if (pers.indexOf('솔선수범') !== -1) ['T101', 'T102', 'T103', 'A201'].forEach(function (id) { add(id, 10, '리더십 적합'); });
    if (pers.indexOf('분석·계획') !== -1) ['T502', 'T503', 'T703', 'A202'].forEach(function (id) { add(id, 10, '분석력 활용'); });
    if (pers.indexOf('체력·현장') !== -1 || pers.indexOf('야외·현장') !== -1) ['T101', 'T102', 'T201', 'T203', 'A201'].forEach(function (id) { add(id, 10, '현장 체력 활용'); });
    if (pers.indexOf('기술·전문') !== -1 || pers.indexOf('첨단장비') !== -1) ['T703', 'T802', 'K403', 'T506', 'K408'].forEach(function (id) { add(id, 10, '기술 전문성'); });
    if (pers.indexOf('소통·봉사') !== -1 || pers.indexOf('대인관계') !== -1) ['S101', 'S301', 'A401', 'T501'].forEach(function (id) { add(id, 10, '소통·봉사 적합'); });
    if (pers.indexOf('꼼꼼·세심') !== -1) ['A301', 'A101', 'K412', 'K413'].forEach(function (id) { add(id, 9, '세밀함 요구'); });
    if (pers.indexOf('도전·모험') !== -1) ['T102', 'T103', 'A201', 'T201'].forEach(function (id) { add(id, 9, '도전정신 발휘'); });
    if (pers.indexOf('창의·아이디어') !== -1) ['A401', 'A501', 'T703'].forEach(function (id) { add(id, 8, '창의성 발휘'); });
    if (pers.indexOf('정보·분석') !== -1) ['T502', 'T503', 'T703', 'T501'].forEach(function (id) { add(id, 9, '정보 분석 적합'); });
    if (pers.indexOf('실내·사무') !== -1) ['T703', 'A301', 'A101', 'S201'].forEach(function (id) { add(id, 8, '실내 근무 선호'); });

    /* ── MBTI 보정 ── */
    if (p.mbti && MBTI_MAP[p.mbti]) {
      var mbtiSpecs = MBTI_MAP[p.mbti].specs;
      for (var mi = 0; mi < mbtiSpecs.length; mi++) {
        add(mbtiSpecs[mi][0], mbtiSpecs[mi][1], 'MBTI(' + p.mbti + ') 성향 적합');
      }
    }

    /* ── 정렬 및 상위 4개 추출 ── */
    var arr = [];
    for (var key in scores) arr.push(scores[key]);
    arr.sort(function (a, b) {
      var aM = (a.majorMatch || a.certMatch) ? 1 : 0;
      var bM = (b.majorMatch || b.certMatch) ? 1 : 0;
      if (bM !== aM) return bM - aM;
      return b.score - a.score;
    });

    var result = [], usedCorps = {};
    for (var ri = 0; ri < arr.length && result.length < 4; ri++) {
      if (!usedCorps[arr[ri].corps]) { result.push(arr[ri]); usedCorps[arr[ri].corps] = true; }
    }
    for (var ri2 = 0; ri2 < arr.length && result.length < 4; ri2++) {
      var ex = false;
      for (var rj = 0; rj < result.length; rj++) if (result[rj].sub.id === arr[ri2].sub.id) { ex = true; break; }
      if (!ex) result.push(arr[ri2]);
    }
    return result.slice(0, 4);
  }

  /* ═══════════════════════════════════════════════
     결과 렌더링
  ═══════════════════════════════════════════════ */
  function buildResult() {
    var recs = recommend(profile);
    lastRecs = recs;
    document.getElementById('resultName').innerHTML = profile.name + '<span>님의 맞춤 특기</span>';
    var mbtiStr = profile.mbti ? profile.mbti + ' · ' : '';
    document.getElementById('resultSub').textContent = profile.major + ' 전공 · ' + mbtiStr + profile.personality.slice(0, 2).join(', ') + ' 기반 분석';

    var rankLabels = ['1지망', '2지망', '3지망', '4지망'];
    var rcClasses = ['rc1', 'rc2', 'rc3', 'rc4'];
    var gridHtml = '';

    recs.forEach(function (rec, i) {
      var d = getDetail(rec.sub.id);
      var cm = CORPS[rec.corps];
      var pct = Math.min(99, Math.max(72, d.match - i * 3 + Math.floor(Math.random() * 3)));
      gridHtml += '<div class="rank-card ' + rcClasses[i] + '" id="rc' + i + '" data-idx="' + i + '" data-specid="' + rec.sub.id + '" data-corps="' + rec.corps + '" onclick="selectCardEv(this)" data-pct="' + pct + '">';
      gridHtml += '<div class="rank-card-top">';
      gridHtml += '<div class="rank-num-row"><span class="rank-num-label">' + rankLabels[i] + '</span><span class="rank-icon">' + cm.icon + '</span></div>';
      gridHtml += '<div class="rank-corps-name">' + rec.corps + '병과 · ' + cm.cat + '</div>';
      gridHtml += '<div class="rank-spec-name">' + rec.sub.name + '</div>';
      gridHtml += '<div class="rank-spec-tag">' + rec.sub.tag + '</div>';
      gridHtml += '</div><div class="match-strip">';
      gridHtml += '<div class="match-row2"><span class="match-lbl2">AI 적합도</span><span class="match-pct">' + pct + '%</span></div>';
      gridHtml += '<div class="bar-bg"><div class="bar-fill" id="bar' + i + '" data-w="' + pct + '"></div></div>';
      gridHtml += '</div></div>';
    });

    gridHtml += '<a href="https://m-recruit.mnd.go.kr/" target="_blank" class="apply-btn-premium">';
    gridHtml += '<div class="premium-badge"><span class="premium-icon">🎖️</span></div>';
    gridHtml += '<div class="premium-inner">';
    gridHtml += '<span class="premium-txt">육군 간부 지원하기</span><span class="premium-arrow">▶</span>';
    gridHtml += '</div></a>';

    document.getElementById('rankGrid').innerHTML = gridHtml;
    setTimeout(function () {
      for (var i = 0; i < 4; i++) {
        var b = document.getElementById('bar' + i);
        if (b) b.style.width = b.getAttribute('data-w') + '%';
      }
    }, 120);

    buildExplorer('전체');
    document.querySelectorAll('.cat-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.cat-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        buildExplorer(this.getAttribute('data-cat'));
      });
    });

    showResultPage(true);
    setTimeout(function () { selectCard(0, recs[0].sub.id, recs[0].corps); }, 350);
  }

  /* ═══════════════════════════════════════════════
     카드 선택 & 상세 패널
  ═══════════════════════════════════════════════ */
  window.selectCard = function (idx, specId, corpsName) {
    if (activeCardIdx === idx) {
      activeCardIdx = -1;
      document.querySelectorAll('.rank-card').forEach(function (c) { c.classList.remove('active-card'); });
      document.getElementById('detailPanel').style.display = 'none';
      return;
    }
    activeCardIdx = idx;
    document.querySelectorAll('.rank-card').forEach(function (c) { c.classList.remove('active-card'); });
    var card = document.getElementById('rc' + idx);
    if (card) card.classList.add('active-card');
    var reasons = (lastRecs[idx] && lastRecs[idx].reasons) || [];
    renderDetailPanel(specId, corpsName, reasons, idx);
    document.getElementById('detailPanel').style.display = 'block';
    setTimeout(function () {
      var p = document.getElementById('detailPanel');
      if (p) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  function renderDetailPanel(specId, corpsName, reasons, rankIdx) {
    var d = getDetail(specId);
    var cm = CORPS[corpsName] || { icon: '🎖️', cat: '' };
    var specObj = null;
    if (cm.subs) for (var i = 0; i < cm.subs.length; i++) if (cm.subs[i].id === specId) { specObj = cm.subs[i]; break; }
    var specName = specObj ? specObj.name : specId;
    var specTag = specObj ? specObj.tag : '';
    var rankLabels = ['1지망', '2지망', '3지망', '4지망'];
    var rankLabel = rankLabels[rankIdx !== undefined ? rankIdx : 0];

    var dutiesHtml = '';
    for (var di = 0; di < d.duties.length; di++) {
      dutiesHtml += '<div class="duty-item"><span class="duty-num">0' + (di + 1) + '</span>' + d.duties[di] + '</div>';
    }

    /* 추천 이유 */
    var reasonHtml = '';
    if (reasons && reasons.length > 0) {
      var tagIcons = { '전공 직결': '🎓', '전공': '🎓', '자격증': '📜', '리더십': '🏅', '분석력': '🔍', '체력': '💪', '기술': '⚙️', '소통': '🤝', '봉사': '🤝', '꼼꼼': '✅', '도전': '🔥', '창의': '💡', '정보': '📡', '실내': '🖥️' };
      var pills = '';
      for (var ri = 0; ri < reasons.length; ri++) {
        var r = reasons[ri];
        var icon = '✔️';
        for (var k in tagIcons) { if (r.indexOf(k) !== -1) { icon = tagIcons[k]; break; } }
        pills += '<span class="why-pill">' + icon + ' ' + r + '</span>';
      }
      reasonHtml = '<div class="d-label">AI 추천 이유</div><div class="why-pills">' + pills + '</div>';
    }

    var h = '<div class="detail-panel">'
      + '<div class="detail-header">'
      + '<div class="detail-close" onclick="closeDetail()">✕</div>'
      + '<div class="detail-header-inner">'
      + '<div><div class="detail-corps">' + rankLabel + ' · ' + corpsName + '병과 · ' + cm.cat + '</div>'
      + '<div class="detail-name">' + cm.icon + ' ' + specName + '</div></div>'
      + '<div class="detail-tag-pill">' + specTag + '</div>'
      + '</div></div>'
      + '<div class="detail-body">'
      + reasonHtml
      + '<div class="d-label">특기 설명</div><div class="d-text">' + d.desc + '</div>'
      + '<div class="d-label">주요 임무</div><div class="duty-grid">' + dutiesHtml + '</div>'
      + '<div class="pros-cons"><div class="pros"><div class="pc-lbl">✅ 장점</div>' + d.pros + '</div><div class="cons"><div class="pc-lbl">⚠️ 고려사항</div>' + d.cons + '</div></div>'
      + '<a class="yt-link" href="' + d.youtube + '" target="_blank" rel="noopener"><span class="yt-icon">▶️</span><div class="yt-txt"><div class="yt-ttl">' + d.ytTitle + '</div><div class="yt-sub">YouTube에서 실제 영상 보기 →</div></div></a>'
      + '</div></div>';

    document.getElementById('detailPanel').innerHTML = h;
  }

  window.closeDetail = function () {
    activeCardIdx = -1;
    document.querySelectorAll('.rank-card').forEach(function (c) { c.classList.remove('active-card'); });
    document.getElementById('detailPanel').style.display = 'none';
  };

  /* ═══════════════════════════════════════════════
     전체 병과 탐색기
  ═══════════════════════════════════════════════ */
  function buildExplorer(cat) {
    openCorpsName = null; openSpecId = null;
    var gridEl = document.getElementById('corpsGrid'), html = '';
    for (var corpsName in CORPS) {
      var cm = CORPS[corpsName];
      if (cat !== '전체' && cm.cat !== cat) continue;
      html += '<div class="corps-card" id="cc_' + corpsName + '" data-corps="' + corpsName + '" onclick="toggleCorpsEv(this)">';
      html += '<span class="corps-card-icon">' + cm.icon + '</span>';
      html += '<div class="corps-card-name">' + corpsName + '병과</div>';
      html += '<div class="corps-card-cat">' + cm.cat + '</div>';
      html += '<div class="corps-specs" id="cs_' + corpsName + '"><div class="spec-list" id="sl_' + corpsName + '"></div></div></div>';
    }
    gridEl.innerHTML = html;
  }

  window.toggleCorps = function (corpsName) {
    var card = document.getElementById('cc_' + corpsName);
    if (!card) return;
    if (openCorpsName && openCorpsName !== corpsName) {
      var oldCard = document.getElementById('cc_' + openCorpsName);
      if (oldCard) oldCard.classList.remove('open');
      openCorpsName = null; openSpecId = null;
    }
    if (card.classList.contains('open')) { card.classList.remove('open'); openCorpsName = null; return; }
    card.classList.add('open'); openCorpsName = corpsName;
    var sl = document.getElementById('sl_' + corpsName);
    if (!sl) return;
    var cm = CORPS[corpsName], h = '';
    cm.subs.forEach(function (sub) {
      h += '<div class="spec-item" id="si_' + sub.id + '" data-specid="' + sub.id + '" data-corps="' + corpsName + '" onclick="toggleSpecEv(event,this)">';
      h += '<div class="spec-item-left"><span class="spec-item-name">' + sub.name + '</span><span class="spec-item-tag"> · ' + sub.tag + '</span></div>';
      h += '<span class="spec-item-arrow">▼</span></div>';
      h += '<div class="spec-detail" id="sd_' + sub.id + '"></div>';
    });
    sl.innerHTML = h;
  };

  /* ═══════════════════════════════════════════════
     이벤트 래퍼 (data-attribute 기반)
  ═══════════════════════════════════════════════ */
  window.selectCardEv = function (el) {
    selectCard(parseInt(el.getAttribute('data-idx')), el.getAttribute('data-specid'), el.getAttribute('data-corps'));
  };

  window.toggleCorpsEv = function (el) {
    toggleCorps(el.getAttribute('data-corps'));
  };

  window.toggleSpecEv = function (e, el) {
    e.stopPropagation();
    var specId = el.getAttribute('data-specid');
    var si = el;
    var sd = document.getElementById('sd_' + specId);
    if (!si || !sd) return;
    if (openSpecId && openSpecId !== specId) {
      var oldSi = document.getElementById('si_' + openSpecId);
      var oldSd = document.getElementById('sd_' + openSpecId);
      if (oldSi) oldSi.classList.remove('spec-open');
      if (oldSd) oldSd.style.display = 'none';
      openSpecId = null;
    }
    if (si.classList.contains('spec-open')) {
      si.classList.remove('spec-open'); sd.style.display = 'none'; openSpecId = null; return;
    }
    si.classList.add('spec-open'); sd.style.display = 'block'; openSpecId = specId;
    var d = getDetail(specId);
    var chips = '';
    d.duties.forEach(function (duty) { chips += '<span class="spec-duty-chip">' + duty + '</span>'; });
    var h = '<div class="spec-detail-desc">' + d.desc + '</div>';
    h += '<div class="spec-duty-chips">' + chips + '</div>';
    h += '<div class="spec-pc"><div class="spec-pros-box"><strong>✅ 장점</strong>' + d.pros + '</div><div class="spec-cons-box"><strong>⚠️ 고려사항</strong>' + d.cons + '</div></div>';
    h += '<a class="spec-yt" href="' + d.youtube + '" target="_blank" rel="noopener">▶ ' + d.ytTitle + '</a>';
    sd.innerHTML = h;
    setTimeout(function () { si.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
  };

  /* ═══════════════════════════════════════════════
     초기화
  ═══════════════════════════════════════════════ */
  function resetAll() {
    certs = []; profile = {}; activeCardIdx = -1; openCorpsName = null; openSpecId = null; lastRecs = [];
    selectedMbti = null;
    ['inp_name', 'inp_age', 'inp_majorDetail', 'inp_extra', 'certInput'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    ['inp_gender', 'inp_edu', 'inp_major'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.value = '';
    });
    var cl = document.getElementById('certList');
    if (cl) cl.innerHTML = '';
    document.querySelectorAll('.chip.selected').forEach(function (c) { c.classList.remove('selected'); });
    document.querySelectorAll('.mbti-btn.selected').forEach(function (b) { b.classList.remove('selected'); });
    var mbtiDesc = document.getElementById('mbtiDesc');
    if (mbtiDesc) mbtiDesc.textContent = 'MBTI를 선택하면 유형별 추천 가점이 부여됩니다.';
    document.querySelectorAll('.error-msg').forEach(function (e) { e.style.display = 'none'; });
    showResultPage(false);
    goStep(1);
  }

})();
