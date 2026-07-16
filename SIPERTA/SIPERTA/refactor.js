const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Extract CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
    fs.mkdirSync('src/css', { recursive: true });
    fs.writeFileSync('src/css/style.css', cssMatch[1].trim());
}

// 2. Build api.js
const apiJs = `/* ========================================================================
   API LOGIC (Supabase & Gemini)
   ======================================================================== */
var SUPABASE_URL = "https://sazyxqksqgqdvujayses.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_E59_bj-T0ySemL3puwr6Vw_sp2-Y7jA";
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var ADMIN_PASSWORD = "admin03";
var GEMINI_MODEL = "gemini-1.5-flash";
var GEMINI_STORAGE_KEY = "gemini_api_key";
var let_GEMINI_API_KEY_CADANGAN = "";
var adminSudahLogin = false;

var GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
var GEMINI_MODEL_FALLBACKS = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest"
];

async function muatTabelAduanPublik() {
  var tbody = document.getElementById("tabelAduanPublik");
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Memuat data aduan...</td></tr>';

  var hasil = await supabaseClient.from("pengaduan").select("*").order("created_at", { ascending: false });

  if (hasil.error) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger py-3">Gagal memuat: ' + escapeHtml(hasil.error.message) + "</td></tr>";
    return;
  }
  if (!hasil.data || hasil.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Belum ada aduan warga.</td></tr>';
    return;
  }
  var barisHtml = "";
  for (var idx = 0; idx < hasil.data.length; idx++) {
    var baris = hasil.data[idx];
    var deskSingkat = String(baris.deskripsi || "");
    if (deskSingkat.length > 60) deskSingkat = deskSingkat.substring(0, 60) + "…";
    barisHtml += "<tr>";
    barisHtml += '<td class="small">' + formatTanggal(baris.created_at) + "</td>";
    barisHtml += "<td><strong>" + escapeHtml(baris.nama_pelapor) + "</strong><br><small>" + escapeHtml(baris.no_wa) + "</small></td>";
    barisHtml += "<td>" + escapeHtml(baris.jenis_fasilitas) + "<br><small>" + escapeHtml(deskSingkat) + "</small></td>";
    barisHtml += "<td>" + buatBadgeStatus(baris.status) + "</td>";
    barisHtml += "</tr>";
  }
  tbody.innerHTML = barisHtml;
}

async function muatTabelAduanAdmin() {
  var tbody = document.getElementById("tabelAduanAdmin");
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Memuat data aduan...</td></tr>';

  var hasil = await supabaseClient.from("pengaduan").select("*").order("created_at", { ascending: false });

  if (hasil.error) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger py-3">Gagal memuat: ' + escapeHtml(hasil.error.message) + "</td></tr>";
    return;
  }
  if (!hasil.data || hasil.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Belum ada aduan warga.</td></tr>';
    return;
  }
  var barisHtml = "";
  for (var idx = 0; idx < hasil.data.length; idx++) {
    var baris = hasil.data[idx];
    var statusSaatIni = baris.status || "Pending";
    barisHtml += "<tr>";
    barisHtml += '<td class="small">' + formatTanggal(baris.created_at) + "</td>";
    barisHtml += "<td><strong>" + escapeHtml(baris.nama_pelapor) + "</strong><br><small>WA: " + escapeHtml(baris.no_wa) + "</small></td>";
    barisHtml += "<td><strong>" + escapeHtml(baris.jenis_fasilitas) + "</strong><br><small>" + escapeHtml(baris.deskripsi) + "</small></td>";
    barisHtml += '<td><select class="form-select form-select-sm status-select-admin" onchange="ubahStatusAduanAdmin(\\'' + baris.id + '\\', this.value)">';
    barisHtml += '<option value="Pending"' + (statusSaatIni === "Pending" ? " selected" : "") + ">Pending</option>";
    barisHtml += '<option value="Diproses"' + (statusSaatIni === "Diproses" ? " selected" : "") + ">Diproses</option>";
    barisHtml += '<option value="Selesai"' + (statusSaatIni === "Selesai" ? " selected" : "") + ">Selesai</option>";
    barisHtml += "</select></td>";
    barisHtml += "</tr>";
  }
  tbody.innerHTML = barisHtml;
}

window.ubahStatusAduanAdmin = async function (idAduan, statusBaru) {
  var hasil = await supabaseClient.from("pengaduan").update({ status: statusBaru }).eq("id", idAduan);
  if (hasil.error) {
    tampilNotifikasi("Gagal mengubah status: " + hasil.error.message, true);
  } else {
    tampilNotifikasi("Status aduan diperbarui: " + statusBaru, false);
    muatTabelAduanPublik();
  }
};

function ambilGeminiApiKey() {
  var dariStorage = localStorage.getItem(GEMINI_STORAGE_KEY);
  if (dariStorage !== null && dariStorage !== undefined && String(dariStorage).trim() !== "") {
    return String(dariStorage).trim();
  }
  if (let_GEMINI_API_KEY_CADANGAN !== null && String(let_GEMINI_API_KEY_CADANGAN).trim() !== "") {
    return String(let_GEMINI_API_KEY_CADANGAN).trim();
  }
  return "";
}

function perbaruiStatusGemini() {
  var box = document.getElementById("geminiStatusText");
  var key = ambilGeminiApiKey();
  if (key !== "") {
    var mask = key.substring(0, 4) + "********" + key.substring(key.length - 4);
    box.textContent = "API Key aktif: " + mask;
    box.classList.add("gemini-ok");
  } else {
    box.textContent = "Belum ada API Key. Fitur Format dengan AI belum aktif.";
    box.classList.remove("gemini-ok");
  }
}

function buatBodyGemini(teksWarga) {
  return {
    contents: [{
      parts: [{
        text: "Ubah kalimat berikut menjadi bahasa surat resmi, baku, formal, dan rapi untuk keperluan surat pengantar RT: " + teksWarga
      }]
    }]
  };
}

function buatUrlGemini(namaModel, apiKey) {
  return GEMINI_API_BASE + namaModel + ":generateContent?key=" + encodeURIComponent(apiKey);
}

async function fetchGeminiKeUrl(urlApi, bodyJson) {
  var respons = await fetch(urlApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyJson
  });
  var json = await respons.json().catch(function () { return {}; });
  return { respons: respons, json: json };
}

async function panggilGeminiAPI(teksKasual) {
  var apiKey = localStorage.getItem(GEMINI_STORAGE_KEY) || ambilGeminiApiKey();
  if (apiKey === "") throw new Error("API Key Gemini belum disimpan. Minta Pak RT menyimpan key di Panel Admin.");

  var teksWarga = String(teksKasual || "").trim();
  var bodyJson = JSON.stringify(buatBodyGemini(teksWarga));
  var lastError = null;

  for (var modelIndex = 0; modelIndex < GEMINI_MODEL_FALLBACKS.length; modelIndex++) {
    var namaModel = GEMINI_MODEL_FALLBACKS[modelIndex];
    var urlApi = buatUrlGemini(namaModel, apiKey);
    try {
      var hasil = await fetchGeminiKeUrl(urlApi, bodyJson);
      if (hasil.respons.ok) return hasil.json;

      var pesanApi = (hasil.json.error && hasil.json.error.message) ? hasil.json.error.message : "Permintaan ke Gemini gagal (HTTP " + hasil.respons.status + ")";
      var modelNotFound = hasil.respons.status === 404 || /not found|is not supported/i.test(pesanApi);
      if (modelNotFound && modelIndex < GEMINI_MODEL_FALLBACKS.length - 1) {
        lastError = new Error(pesanApi);
        continue;
      }
      throw new Error(pesanApi);
    } catch (errDirect) {
      var adalahCors = errDirect.name === "TypeError" || /failed to fetch/i.test(errDirect.message || "");
      if (adalahCors) {
        var urlProxy = "https://corsproxy.io/?" + encodeURIComponent(urlApi);
        var hasilProxy = await fetchGeminiKeUrl(urlProxy, bodyJson);
        if (hasilProxy.respons.ok) return hasilProxy.json;
        var pesanProxy = (hasilProxy.json.error && hasilProxy.json.error.message) ? hasilProxy.json.error.message : errDirect.message;
        var proxyNotFound = hasilProxy.respons.status === 404 || /not found|is not supported/i.test(pesanProxy);
        if (proxyNotFound && modelIndex < GEMINI_MODEL_FALLBACKS.length - 1) {
          lastError = new Error(pesanProxy);
          continue;
        }
        throw new Error(pesanProxy);
      }
      if (modelIndex < GEMINI_MODEL_FALLBACKS.length - 1) {
        lastError = errDirect;
        continue;
      }
      throw errDirect;
    }
  }
  if (lastError) throw lastError;
  throw new Error("Tidak ada model Gemini yang tersedia untuk API key ini.");
}

function ambilTeksDariResponsGemini(responsJson) {
  var kandidat = responsJson.candidates;
  if (!kandidat || !kandidat[0] || !kandidat[0].content || !kandidat[0].content.parts) return "";
  var parts = kandidat[0].content.parts;
  var gabung = "";
  for (var p = 0; p < parts.length; p++) gabung += (parts[p].text || "");
  return gabung.trim();
}
`;
fs.writeFileSync('src/js/api.js', apiJs);

// 3. Build ui.js (extracting base64 dynamically)
const b64Match = html.match(/var KODE_BASE64_TTD_KETUA_RT = "([^"]+)";/);
const base64Str = b64Match ? b64Match[1] : "";

const uiJs = `/* ========================================================================
   UI & RENDERING LOGIC
   ======================================================================== */
var DAFTAR_HALAMAN_WARGA = ["halaman-pengaduan", "halaman-surat"];

function tampilkanZonaWarga() {
  document.getElementById("zona-halaman-warga").style.display = "block";
  document.getElementById("zona-halaman-pak-rt").style.display = "none";
  document.getElementById("navMenuWarga").style.display = "flex";
  document.getElementById("btnMasukPakRT").style.display = "inline-flex";
}

function tampilkanZonaPakRT() {
  document.getElementById("zona-halaman-warga").style.display = "none";
  document.getElementById("zona-halaman-pak-rt").style.display = "block";
  document.getElementById("navMenuWarga").style.display = "none";
  document.getElementById("btnMasukPakRT").style.display = "none";
  tampilkanHalamanAdmin();
}

function bukaHalaman(idHalaman) {
  for (var i = 0; i < DAFTAR_HALAMAN_WARGA.length; i++) {
    var el = document.getElementById(DAFTAR_HALAMAN_WARGA[i]);
    if (el) {
      el.style.display = "none";
      el.classList.remove("page-visible");
    }
  }
  var elTarget = document.getElementById(idHalaman);
  if (elTarget) {
    elTarget.style.display = "block";
    elTarget.classList.add("page-visible");
  }

  document.getElementById("navBtnPengaduan").classList.remove("nav-active");
  document.getElementById("navBtnSurat").classList.remove("nav-active");

  if (idHalaman === "halaman-pengaduan") {
    document.getElementById("navBtnPengaduan").classList.add("nav-active");
    muatTabelAduanPublik();
  }
  if (idHalaman === "halaman-surat") {
    document.getElementById("navBtnSurat").classList.add("nav-active");
  }
}

function tampilkanFormLoginAdmin() {
  document.getElementById("bagianLoginAdmin").style.display = "block";
  document.getElementById("bagianPanelAdmin").style.display = "none";
  document.getElementById("inputPasswordAdmin").value = "";
  document.getElementById("adminLoginErrorMsg").classList.remove("admin-login-error-show");
}

function tampilkanPanelManajemenAdmin() {
  document.getElementById("bagianLoginAdmin").style.display = "none";
  document.getElementById("bagianPanelAdmin").style.display = "block";
  document.getElementById("inputGeminiKey").value = "";
  perbaruiStatusGemini();
  muatTabelAduanAdmin();
}

function tampilkanHalamanAdmin() {
  if (adminSudahLogin === true) {
    tampilkanPanelManajemenAdmin();
  } else {
    tampilkanFormLoginAdmin();
  }
}

function tampilNotifikasi(pesan, adalahError) {
  var toast = document.getElementById("toastNotif");
  toast.textContent = pesan;
  toast.className = "toast-visible";
  if (adalahError === true) {
    toast.classList.add("toast-error");
  } else {
    toast.classList.remove("toast-error");
  }
  if (toast._timeoutId) {
    clearTimeout(toast._timeoutId);
  }
  toast._timeoutId = setTimeout(function () {
    toast.classList.remove("toast-visible");
  }, 3500);
}

function escapeHtml(teks) {
  var div = document.createElement("div");
  div.textContent = teks === null || teks === undefined ? "" : String(teks);
  return div.innerHTML;
}

function formatTanggal(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function buatBadgeStatus(status) {
  var teks = status || "Pending";
  var lower = String(teks).toLowerCase();
  var kelas = "badge-status-pending";
  if (lower.indexOf("proses") >= 0) kelas = "badge-status-proses";
  if (lower.indexOf("selesai") >= 0) kelas = "badge-status-selesai";
  return '<span class="' + kelas + '">' + escapeHtml(teks) + '</span>';
}

function validasiNikKetat(event) {
  var nikInputEl = document.getElementById("nikInput");
  var nikErrorEl = document.getElementById("nikErrorMsg");
  var nilaiNik = nikInputEl.value.trim();
  if (nilaiNik.length !== 16 || !/^\\d+$/.test(nilaiNik)) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    nikErrorEl.textContent = "NIK Harus Tepat 16 Angka!";
    nikErrorEl.classList.add("nik-error-show");
    nikInputEl.classList.add("nik-input-error");
    nikInputEl.focus();
    tampilNotifikasi("NIK Harus Tepat 16 Angka!", true);
    return false;
  }
  nikErrorEl.classList.remove("nik-error-show");
  nikInputEl.classList.remove("nik-input-error");
  return true;
}

function kumpulkanDataSurat() {
  var selectTemplate = document.getElementById("pilihTemplate");
  var nikInputEl = document.getElementById("nikInput");
  if (selectTemplate.value === "pengantar") {
    return {
      jenis_template: "Surat Pengantar",
      nama: document.getElementById("inputNama").value.trim(),
      nik: nikInputEl.value.trim(),
      ttl: document.getElementById("inputTtl").value.trim(),
      jk: document.getElementById("inputJk").value,
      agama: document.getElementById("inputAgama").value.trim(),
      pekerjaan: document.getElementById("inputPekerjaan").value.trim(),
      jenis_pengurusan: document.getElementById("inputJenisPengurusan").value.trim(),
      keperluan: document.getElementById("inputKeperluan").value.trim()
    };
  }
  return {
    jenis_template: "Surat Undangan Warga",
    jenis_kegiatan: document.getElementById("inputKegiatan").value.trim(),
    hari_tanggal: document.getElementById("inputHariTanggal").value.trim(),
    waktu: document.getElementById("inputWaktu").value.trim(),
    tempat: document.getElementById("inputTempat").value.trim(),
    agenda: document.getElementById("inputAgenda").value.trim()
  };
}

function tanggalSuratPanjang() {
  return new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function buatNomorSurat() {
  var sekarang = new Date();
  var bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
  var urut = String(sekarang.getDate()).padStart(2, '0') + String(sekarang.getHours());
  return urut + "/RT.03/" + bulan + "/" + sekarang.getFullYear();
}

function htmlKopSurat() {
  return (
    '<div class="kop-surat">' +
    '<div class="line-sm">PEMERINTAH KABUPATEN SUKOHARJO</div>' +
    '<div class="line-sm">KECAMATAN BAKI — KELURAHAN KUDU</div>' +
    '<div class="line-md">RUKUN TETANGGA 03</div>' +
    '<div class="line-lg">RUKUN WARGA 03 DEMALANG</div>' +
    '<div class="line-address">Jl. Demalang — RT 03 / RW 03, Kudu, Baki, Sukoharjo 57556</div>' +
    '<div class="line-contact">Telp/WA Pengurus RT 03 Demalang</div>' +
    "</div>"
  );
}

var KODE_BASE64_TTD_KETUA_RT = "${base64Str}";

function htmlBlokTandaTangan() {
  return (
    '<div class="surat-ttd-block">' +
    "<p>Demalang, " + tanggalSuratPanjang() + "</p>" +
    '<div class="ttd-center-wrap" style="text-align: center; display: inline-block; width: 250px;">' +
    '<p class="ttd-jabatan">Ketua RT 03 Demalang,</p>' +
    '<img src="' + KODE_BASE64_TTD_KETUA_RT + '" alt="Stempel dan Tanda Tangan Ketua RT" class="ttd-gambar" style="width: 210px; height: auto; display: block; margin-top: -10px; margin-bottom: -15px; margin-left: auto; margin-right: auto; position: relative; z-index: 2;" />' +
    '<p class="ttd-nama">Mardiono</p>' +
    "</div>" +
    "</div>"
  );
}

function htmlSuratPengantar(dataSurat) {
  return (
    htmlKopSurat() +
    '<div class="surat-nomor">Nomor: ' + buatNomorSurat() + "</div>" +
    '<div class="surat-judul">SURAT PENGANTAR</div>' +
    '<div class="surat-body-text">' +
    "<p>Yang bertanda tangan di bawah ini, Ketua RT 03 RW 03 Demalang, Kudu, Baki, Sukoharjo, dengan ini menerangkan bahwa:</p>" +
    '<table class="surat-tabel-data">' +
    "<tr><td>Nama</td><td>: " + escapeHtml(dataSurat.nama) + "</td></tr>" +
    "<tr><td>NIK</td><td>: " + escapeHtml(dataSurat.nik) + "</td></tr>" +
    "<tr><td>Tempat/Tgl Lahir</td><td>: " + escapeHtml(dataSurat.ttl) + "</td></tr>" +
    "<tr><td>Jenis Kelamin</td><td>: " + escapeHtml(dataSurat.jk) + "</td></tr>" +
    "<tr><td>Agama</td><td>: " + escapeHtml(dataSurat.agama) + "</td></tr>" +
    "<tr><td>Pekerjaan</td><td>: " + escapeHtml(dataSurat.pekerjaan) + "</td></tr>" +
    "</table>" +
    "<p>Adalah benar warga RT 03 RW 03 Demalang yang berdomisili di lingkungan kami dan dikenal berkelakuan baik.</p>" +
    "<p>Surat pengantar ini dibuat untuk keperluan <strong>" + escapeHtml(dataSurat.jenis_pengurusan) + "</strong>, dengan rincian:</p>" +
    '<p class="indent">' + escapeHtml(dataSurat.keperluan) + "</p>" +
    "<p>Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>" +
    "</div>" +
    htmlBlokTandaTangan()
  );
}

function htmlSuratUndangan(dataSurat) {
  return (
    htmlKopSurat() +
    '<div class="surat-nomor">Nomor: ' + buatNomorSurat() + "</div>" +
    '<div class="surat-judul">SURAT UNDANGAN WARGA</div>' +
    '<div class="surat-body-text">' +
    "<p>Kepada Yth.<br>Bapak/Ibu Warga RT 03 RW 03 Demalang<br>di tempat</p>" +
    '<p class="indent">Dengan hormat, dalam rangka tertib lingkungan dan kebersamaan warga, kami mengundang Bapak/Ibu untuk hadir pada kegiatan berikut:</p>' +
    '<table class="surat-tabel-data">' +
    "<tr><td>Jenis Kegiatan</td><td>: " + escapeHtml(dataSurat.jenis_kegiatan) + "</td></tr>" +
    "<tr><td>Hari / Tanggal</td><td>: " + escapeHtml(dataSurat.hari_tanggal) + "</td></tr>" +
    "<tr><td>Waktu</td><td>: " + escapeHtml(dataSurat.waktu) + "</td></tr>" +
    "<tr><td>Tempat</td><td>: " + escapeHtml(dataSurat.tempat) + "</td></tr>" +
    "</table>" +
    "<p><strong>Agenda Acara:</strong></p>" +
    '<p class="indent" style="white-space: pre-line;">' + escapeHtml(dataSurat.agenda) + "</p>" +
    "<p>Kehadiran Bapak/Ibu sangat kami harapkan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>" +
    "</div>" +
    htmlBlokTandaTangan()
  );
}

function tampilkanPratinjauSurat(htmlSurat) {
  var previewEl = document.getElementById("suratA4Content");
  previewEl.className = "surat-kertas-a4";
  previewEl.innerHTML = htmlSurat;
  document.getElementById("suratPreviewBox").classList.add("surat-preview-visible");
  document.getElementById("suratPlaceholderText").style.display = "none";
  return previewEl;
}

function unduhPdfSurat(namaFile) {
  var elementAsli = document.getElementById("suratA4Content");
  if (!elementAsli || !elementAsli.innerHTML.trim()) {
    return Promise.reject(new Error("Konten surat belum tersedia untuk dicetak."));
  }

  var elementCetak = elementAsli.cloneNode(true);
  elementCetak.removeAttribute("id");

  elementCetak.style.fontFamily = "'Times New Roman', Times, serif";
  elementCetak.style.display = "block";
  elementCetak.style.position = "relative";
  elementCetak.style.margin = "0";
  elementCetak.style.marginTop = "0";
  elementCetak.style.paddingTop = "10mm";
  elementCetak.style.paddingBottom = "10mm";
  elementCetak.style.paddingLeft = "25mm";
  elementCetak.style.paddingRight = "20mm";
  elementCetak.style.width = "210mm";
  elementCetak.style.maxWidth = "210mm";
  elementCetak.style.height = "auto";
  elementCetak.style.minHeight = "0";
  elementCetak.style.boxSizing = "border-box";
  elementCetak.style.background = "#ffffff";
  elementCetak.style.color = "#000000";
  elementCetak.style.boxShadow = "none";
  elementCetak.style.overflow = "hidden";
  elementCetak.style.alignSelf = "auto";
  elementCetak.style.justifyContent = "flex-start";
  elementCetak.style.alignItems = "flex-start";

  var anakSurat = elementCetak.querySelectorAll("*");
  for (var idx = 0; idx < anakSurat.length; idx++) {
    anakSurat[idx].style.fontFamily = "'Times New Roman', Times, serif";
  }

  var wadahCetak = document.getElementById("suratPdfHidden");
  wadahCetak.innerHTML = "";
  wadahCetak.style.display = "block";
  wadahCetak.style.alignItems = "flex-start";
  wadahCetak.style.justifyContent = "flex-start";
  wadahCetak.appendChild(elementCetak);

  var opt = {
    margin: 0,
    filename: namaFile,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all"] }
  };

  return html2pdf()
    .set(opt)
    .from(elementCetak)
    .save()
    .then(function () {
      wadahCetak.innerHTML = "";
    })
    .catch(function (err) {
      wadahCetak.innerHTML = "";
      throw err;
    });
}

function tungguLayoutSiap(elemen) {
  return new Promise(function (resolve) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        void elemen.offsetHeight;
        setTimeout(resolve, 180);
      });
    });
  });
}

async function jalankanCetakSurat(event, tombolEl) {
  var selectTemplate = document.getElementById("pilihTemplate");
  var formPengantarEl = document.getElementById("formPengantar");
  var formUndanganEl = document.getElementById("formUndangan");

  if (selectTemplate.value === "pengantar") {
    if (!formPengantarEl.checkValidity()) {
      event.preventDefault();
      formPengantarEl.reportValidity();
      return;
    }
    if (!validasiNikKetat(event)) return;
  } else {
    if (!formUndanganEl.checkValidity()) {
      event.preventDefault();
      formUndanganEl.reportValidity();
      return;
    }
  }

  var dataSurat = kumpulkanDataSurat();
  var tombolCetak = tombolEl || document.getElementById("btnCetakSurat");
  var labelTombol = tombolCetak.innerHTML;
  tombolCetak.disabled = true;
  tombolCetak.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';

  var payloadArsip;
  if (dataSurat.jenis_template === "Surat Pengantar") {
    payloadArsip = {
      nik: dataSurat.nik,
      nama_warga: dataSurat.nama,
      jenis_surat: dataSurat.jenis_template,
      keperluan: dataSurat.keperluan
    };
  } else {
    payloadArsip = {
      nik: "-",
      nama_warga: "Warga RT 03 Demalang",
      jenis_surat: dataSurat.jenis_template,
      keperluan: "Kegiatan: " + dataSurat.jenis_kegiatan + " | Tanggal: " + dataSurat.hari_tanggal + " | Waktu: " + dataSurat.waktu + " | Tempat: " + dataSurat.tempat + " | Agenda: " + dataSurat.agenda
    };
  }

  var hasilInsert = await supabaseClient.from("arsip_surat").insert([payloadArsip]);

  if (hasilInsert.error) {
    tombolCetak.disabled = false;
    tombolCetak.innerHTML = labelTombol;
    tampilNotifikasi("Gagal menyimpan arsip surat: " + hasilInsert.error.message, true);
    return;
  }

  try {
    if (typeof html2pdf === "undefined") {
      throw new Error("Library html2pdf.js belum termuat. Periksa koneksi internet.");
    }

    var htmlUntukPdf;
    if (dataSurat.jenis_template === "Surat Pengantar") {
      htmlUntukPdf = htmlSuratPengantar(dataSurat);
    } else {
      htmlUntukPdf = htmlSuratUndangan(dataSurat);
    }

    tampilkanPratinjauSurat(htmlUntukPdf);
    await tungguLayoutSiap(document.getElementById("suratA4Content"));

    var namaFile = dataSurat.jenis_template.replace(/\\s+/g, "_") + "_" + Date.now() + ".pdf";

    await unduhPdfSurat(namaFile);

    tampilNotifikasi("Surat diarsipkan dan PDF berhasil diunduh.", false);
  } catch (errPdf) {
    console.error(errPdf);
    tampilNotifikasi("Arsip tersimpan, tetapi PDF gagal: " + errPdf.message, true);
  }

  tombolCetak.disabled = false;
  tombolCetak.innerHTML = labelTombol;
}
`;
fs.writeFileSync('src/js/ui.js', uiJs);

// 4. Build app.js
const appJs = `/* ========================================================================
   APP ORCHESTRATION & EVENT LISTENERS
   ======================================================================== */

// Navigation
document.getElementById("btnMasukPakRT").onclick = function () {
  tampilkanZonaPakRT();
};
document.getElementById("btnKembaliWarga").onclick = function () {
  tampilkanZonaWarga();
  bukaHalaman("halaman-pengaduan");
};
document.getElementById("btnKembaliWargaLogin").onclick = function () {
  tampilkanZonaWarga();
  bukaHalaman("halaman-pengaduan");
};

// Admin Login
document.getElementById("btnLoginAdmin").onclick = function () {
  var password = document.getElementById("inputPasswordAdmin").value;
  if (password === ADMIN_PASSWORD) {
    adminSudahLogin = true;
    document.getElementById("adminLoginErrorMsg").classList.remove("admin-login-error-show");
    tampilkanPanelManajemenAdmin();
    tampilNotifikasi("Login admin berhasil.", false);
  } else {
    document.getElementById("adminLoginErrorMsg").classList.add("admin-login-error-show");
  }
};

document.getElementById("inputPasswordAdmin").onkeydown = function (evt) {
  if (evt.key === "Enter") {
    document.getElementById("btnLoginAdmin").click();
  }
};

document.getElementById("btnLogoutAdmin").onclick = function () {
  adminSudahLogin = false;
  tampilkanFormLoginAdmin();
  tampilNotifikasi("Anda telah keluar dari Panel Admin.", false);
};

// Gemini API Key Save
document.getElementById("btnSimpanGeminiKey").onclick = function () {
  var keyBaru = document.getElementById("inputGeminiKey").value.trim();
  if (keyBaru === "") {
    tampilNotifikasi("API Key tidak boleh kosong.", true);
    return;
  }
  localStorage.setItem(GEMINI_STORAGE_KEY, keyBaru);
  document.getElementById("inputGeminiKey").value = "";
  perbaruiStatusGemini();
  tampilNotifikasi("Gemini API Key berhasil disimpan.", false);
};

// Pengaduan
document.getElementById("btnMuatUlangAduan").onclick = function () {
  muatTabelAduanPublik();
};
document.getElementById("btnMuatUlangAdmin").onclick = function () {
  muatTabelAduanAdmin();
};

document.getElementById("formPengaduan").onsubmit = async function (event) {
  event.preventDefault();
  var tombol = document.getElementById("btnKirimAduan");
  tombol.disabled = true;

  var dataInsert = {
    nama_pelapor: document.getElementById("namaPelapor").value.trim(),
    no_wa: document.getElementById("noWa").value.trim(),
    jenis_fasilitas: document.getElementById("jenisFasilitas").value,
    deskripsi: document.getElementById("deskripsi").value.trim(),
    status: "Pending"
  };

  var hasil = await supabaseClient.from("pengaduan").insert([dataInsert]);
  tombol.disabled = false;

  if (hasil.error) {
    tampilNotifikasi("Gagal mengirim aduan: " + hasil.error.message, true);
    return;
  }

  tampilNotifikasi("Aduan berhasil dikirim ke database.", false);
  document.getElementById("formPengaduan").reset();
  muatTabelAduanPublik();
  if (adminSudahLogin === true) {
    muatTabelAduanAdmin();
  }
};

// Format AI
document.getElementById("btnFormatAI").onclick = async function () {
  var textareaKeperluan = document.getElementById("inputKeperluan");
  var errorAi = document.getElementById("aiErrorMsg");
  var teksAsli = textareaKeperluan.value.trim();
  errorAi.classList.remove("ai-error-show");
  errorAi.textContent = "";

  if (teksAsli === "") {
    tampilNotifikasi("Isi Keperluan Detail terlebih dahulu.", true);
    textareaKeperluan.focus();
    return;
  }

  var tombolAi = document.getElementById("btnFormatAI");
  var labelAsli = tombolAi.innerHTML;
  tombolAi.disabled = true;
  tombolAi.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';

  try {
    var respons = await panggilGeminiAPI(teksAsli);
    var teksFormal = ambilTeksDariResponsGemini(respons);
    if (teksFormal === "") throw new Error("Respons AI kosong. Periksa API key atau kuota Gemini.");
    textareaKeperluan.value = teksFormal.replace(/^["']|["']$/g, "");
    tampilNotifikasi("Keperluan berhasil diformat secara resmi.", false);
  } catch (errAi) {
    errorAi.textContent = errAi.message;
    errorAi.classList.add("ai-error-show");
    tampilNotifikasi("Format AI gagal: " + errAi.message, true);
  }

  tombolAi.disabled = false;
  tombolAi.innerHTML = labelAsli;
};

// NIK Input
var nikInputEl = document.getElementById("nikInput");
var nikErrorEl = document.getElementById("nikErrorMsg");
if (nikInputEl) {
  nikInputEl.oninput = function () {
    nikInputEl.value = nikInputEl.value.replace(/\\D/g, "").slice(0, 16);
    if (nikInputEl.value.length === 16 && /^\\d{16}$/.test(nikInputEl.value)) {
      nikErrorEl.classList.remove("nik-error-show");
      nikInputEl.classList.remove("nik-input-error");
    }
  };
}

// Print
var selectTemplate = document.getElementById("pilihTemplate");
document.getElementById("btnCetakSurat").onclick = function (event) {
  selectTemplate.value = "pengantar";
  jalankanCetakSurat(event, document.getElementById("btnCetakSurat"));
};
document.getElementById("btnCetakSuratUndangan").onclick = function (event) {
  selectTemplate.value = "undangan";
  jalankanCetakSurat(event, document.getElementById("btnCetakSuratUndangan"));
};

// Initialize
tampilkanZonaWarga();
bukaHalaman("halaman-pengaduan");
muatTabelAduanPublik();
perbaruiStatusGemini();
`;
fs.writeFileSync('src/js/app.js', appJs);

// 5. Build clean index.html
let newHtml = html.replace(/<style>[\s\S]*?<\/style>/, '<link href="src/css/style.css" rel="stylesheet">');
newHtml = newHtml.replace(/<script>\s*\/\* ========================================================================\s*KONFIGURASI GLOBAL[\s\S]*?<\/script>/, 
  '<script src="src/js/api.js"><\/script>\n  <script src="src/js/ui.js"><\/script>\n  <script src="src/js/app.js"><\/script>');
fs.writeFileSync('index.html', newHtml);

console.log("Refactoring complete.");
