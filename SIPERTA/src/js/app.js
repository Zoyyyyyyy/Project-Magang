/* ========================================================================
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
document.getElementById("btnLoginAdmin").onclick = async function () {
  var password = document.getElementById("inputPasswordAdmin").value;
  var tombol = document.getElementById("btnLoginAdmin");
  tombol.disabled = true;
  tombol.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memverifikasi...';

  var valid = await verifikasiPasswordAdmin(password);
  tombol.disabled = false;
  tombol.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Masuk';

  if (valid) {
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

// Format AI Agenda
document.getElementById("btnFormatAgendaAI").onclick = async function () {
  var textareaAgenda = document.getElementById("inputAgenda");
  var errorAi = document.getElementById("agendaAiErrorMsg");
  var teksAsli = textareaAgenda.value.trim();
  errorAi.classList.remove("ai-error-show");
  errorAi.textContent = "";

  if (teksAsli === "") {
    tampilNotifikasi("Isi Agenda Acara terlebih dahulu.", true);
    textareaAgenda.focus();
    return;
  }

  var tombolAi = document.getElementById("btnFormatAgendaAI");
  var labelAsli = tombolAi.innerHTML;
  tombolAi.disabled = true;
  tombolAi.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';

  try {
    var respons = await panggilGeminiAPI(teksAsli, true);
    var teksFormal = ambilTeksDariResponsGemini(respons);
    if (teksFormal === "") throw new Error("Respons AI kosong. Periksa API key atau kuota Gemini.");
    textareaAgenda.value = teksFormal.replace(/^["']|["']$/g, "");
    tampilNotifikasi("Agenda berhasil diformat secara resmi.", false);
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
    nikInputEl.value = nikInputEl.value.replace(/\D/g, "").slice(0, 16);
    if (nikInputEl.value.length === 16 && /^\d{16}$/.test(nikInputEl.value)) {
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

var btnDownloadPDFSurat = document.getElementById("btnDownloadPDFSurat");
if (btnDownloadPDFSurat) {
  btnDownloadPDFSurat.onclick = function (event) {
    selectTemplate.value = "pengantar";
    jalankanCetakSurat(event, btnDownloadPDFSurat);
  };
}

document.getElementById("btnCetakSuratUndangan").onclick = function (event) {
  selectTemplate.value = "undangan";
  jalankanCetakSurat(event, document.getElementById("btnCetakSuratUndangan"));
};

// Kembali ke Landing Page
window.kembaliKeLanding = function () {
  document.getElementById("zona-landing").style.display = "flex";
  document.getElementById("zona-halaman-warga").style.display = "none";
  document.getElementById("zona-halaman-pak-rt").style.display = "none";
};

// CTA Landing Page
window.navigasiDariLanding = function (targetHalaman) {
  document.getElementById("zona-landing").style.display = "none";
  tampilkanZonaWarga();
  bukaHalaman(targetHalaman);
};

// Initialize — tampilkan landing page sebagai root view
document.getElementById("zona-landing").style.display = "flex";
document.getElementById("zona-halaman-warga").style.display = "none";
document.getElementById("zona-halaman-pak-rt").style.display = "none";
muatTabelAduanPublik();
perbaruiStatusGemini();
