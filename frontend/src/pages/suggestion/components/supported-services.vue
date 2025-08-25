<template>
    <div class="supported-services-grid">
      <a
        v-for="service in services"
        :key="service.name"
        class="service-item"
        :href="service.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img :src="service.icon" :alt="service.name" class="service-icon">
        <span class="service-label">{{ service.name }}</span>
      </a>
    </div>
</template>

<script setup lang="ts">
const services = [
  { name: 'Kinopoisk', icon: '/icons/services/kinopoisk.svg', url: 'https://www.kinopoisk.ru/' },
  { name: 'Shikimori', icon: '/icons/services/shikimori.svg', url: 'https://shikimori.one/' },
  { name: 'IMDb', icon: '/icons/services/imdb.svg', url: 'https://www.imdb.com/' },
  { name: 'Steam', icon: '/icons/services/steam.svg', url: 'https://store.steampowered.com/' },
  { name: 'IGDb', icon: '/icons/services/igdb.svg', url: 'https://www.igdb.com/' },
]
</script>

<style scoped>
.supported-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(142px, 1fr));
  gap: 10px;
  margin: 18px 0 8px 0;
  width: 100%;
}

.service-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: hsl(200 5% 11%);
  border-radius: 10px;
  padding: 7px 10px;
  box-shadow: 0 2px 8px 0 hsla(240 3.7% 15.9% / 0.3);
  transition: box-shadow 0.2s, background 0.2s;
  text-decoration: none;
  cursor: pointer;
}

.service-item:hover {
  box-shadow: 0 2px 8px 0 hsla(240 3.7% 15.9% / 0.6);
  background: hsl(204 6.33% 15.49%);
}

.service-icon {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 50%;
}

.service-label {
  font-size: 0.98rem;
  font-weight: 500;
  color: var(--secondary-foreground);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
