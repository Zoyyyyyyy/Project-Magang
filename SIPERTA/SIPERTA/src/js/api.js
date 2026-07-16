/* ========================================================================
   API LOGIC (Supabase & Gemini)
   ======================================================================== */
var SUPABASE_URL = "https://sazyxqksqgqdvujayses.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_E59_bj-T0ySemL3puwr6Vw_sp2-Y7jA";
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Password admin dibaca dari Supabase tabel admin_config (key = 'admin_password')
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
    barisHtml += '<td><select class="form-select form-select-sm status-select-admin" onchange="ubahStatusAduanAdmin(\'' + baris.id + '\', this.value)">';
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
    system_instruction: {
      parts: [{
        text: "Tugas Anda adalah memformat kalimat keperluan surat dari warga menjadi satu kalimat resmi, baku, formal, singkat, dan langsung to-the-point untuk keperluan surat pengantar RT. DILARANG memberikan kata pengantar, DILARANG memberikan pilihan (Opsi 1, Opsi 2, dll), DILARANG memberikan penjelasan perubahan kata. Cukup keluarkan SATU KALIMAT HASIL AKHIRNYA SAJA."
      }]
    },
    contents: [{
      role: "user",
      parts: [{ text: teksWarga }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256
    }
  };
}

function buatBodyGeminiAgenda(teksAdmin) {
  return {
    system_instruction: {
      parts: [{
        text: "Tugas Anda adalah menyusun poin-poin agenda acara atau susunan acara untuk surat undangan warga RT secara formal, rapi, dan profesional. Ubah input bahasa sehari-hari dari user menjadi susunan acara resmi menggunakan penomoran atau poin-poin (bullet points). DILARANG memberikan kalimat pengantar seperti 'Berikut adalah hasilnya', DILARANG memberikan penutup, dan DILARANG memberikan penjelasan tambahan apapun. Cukup keluarkan HASIL TULISAN AGENDA ACARANYA SAJA."
      }]
    },
    contents: [{
      role: "user",
      parts: [{ text: teksAdmin }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512
    }
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

async function panggilGeminiAPI(teksKasual, isAgenda = false) {
  var apiKey = localStorage.getItem(GEMINI_STORAGE_KEY) || ambilGeminiApiKey();
  if (apiKey === "") throw new Error("API Key Gemini belum disimpan. Minta Pak RT menyimpan key di Panel Admin.");

  var teksWarga = String(teksKasual || "").trim();
  var bodyObj = isAgenda ? buatBodyGeminiAgenda(teksWarga) : buatBodyGemini(teksWarga);
  var bodyJson = JSON.stringify(bodyObj);
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

async function verifikasiPasswordAdmin(inputPassword) {
  try {
    var hasil = await supabaseClient
      .from("admin_config")
      .select("value")
      .eq("key", "admin_password")
      .single();
    if (hasil.error || !hasil.data) return false;
    return String(inputPassword).trim() === String(hasil.data.value).trim();
  } catch (err) {
    return false;
  }
}
