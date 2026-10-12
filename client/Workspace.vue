<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { api, act } from "./api";
const logs = ref([]),
  stats = ref([]),
  service = ref("billing-api"),
  level = ref("INFO"),
  message = ref("İstek başarıyla tamamlandı"),
  filter = ref(""),
  q = ref("");
let events;
async function load() {
  [logs.value, stats.value] = await Promise.all([
    api("/logs?level=" + filter.value + "&q=" + encodeURIComponent(q.value)),
    api("/stats"),
  ]);
}
async function older() {
  if (!logs.value.length) return;
  const more = await api(
    "/logs?level=" +
      filter.value +
      "&q=" +
      encodeURIComponent(q.value) +
      "&before=" +
      logs.value.at(-1).id,
  );
  logs.value.push(...more);
}
onMounted(async () => {
  await act(load, "");
  events = new EventSource("/api/events");
  events.addEventListener("log", () => act(load, ""));
  events.onopen = () => act(load, "");
});
onUnmounted(() => events?.close());
</script>
<template>
  <div class="grid three">
    <div class="panel" v-for="s in stats">
      <p>{{ s.level }}</p>
      <div class="stat">{{ s.count }}</div>
    </div>
  </div>
  <form
    class="panel"
    @submit.prevent="
      act(async () => {
        await api('/logs', 'POST', { service, level, message });
        await load();
      }, 'Log alındı')
    "
  >
    <h2>Log gönder</h2>
    <div class="toolbar">
      <label>Servis<input v-model="service" required /></label
      ><label
        >Seviye<select v-model="level">
          <option>INFO</option>
          <option>WARN</option>
          <option>ERROR</option>
        </select></label
      ><label>Mesaj<input v-model="message" required /></label
      ><button>Gönder</button>
    </div>
    <small
      >Basit maskeleme: password=, token=, secret=, authorization= alanları.
      Gerçek sırları loglama.</small
    >
  </form>
  <section class="panel">
    <div class="toolbar">
      <h2>Canlı log akışı</h2>
      <label
        >Filtre<select v-model="filter" @change="act(load, '')">
          <option value="">Tümü</option>
          <option>INFO</option>
          <option>WARN</option>
          <option>ERROR</option>
        </select></label
      >
      <form class="toolbar" @submit.prevent="act(load, '')">
        <input
          v-model="q"
          aria-label="Log mesajı ara"
          placeholder="Mesaj ara"
        /><button class="ghost">Ara</button>
      </form>
    </div>
    <div class="tablewrap">
      <table class="log">
        <thead>
          <tr>
            <th>Zaman</th>
            <th>Servis</th>
            <th>Seviye</th>
            <th>Mesaj</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs">
            <td>{{ l.at }}</td>
            <td>{{ l.service }}</td>
            <td>{{ l.level }}</td>
            <td>{{ l.message }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <button class="ghost" @click="act(older, '')">Daha eski kayıtlar</button>
  </section>
</template>
