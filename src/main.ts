import { createApp } from 'vue';
// The fonts come with the app, so they also work offline (Hebrew and Latin, the weights in use).
import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-700.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-700.css';
import '@fontsource/karantina/hebrew-700.css';
import '@fontsource/karantina/latin-700.css';
import App from './App.vue';
import { router } from './router';
import './styles/main.css';
import './styles/parents.css';

createApp(App).use(router).mount('#app');
