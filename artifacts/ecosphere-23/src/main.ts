import { mount } from 'svelte';
import App from './app/App.svelte';
import './index.css';

mount(App, { target: document.getElementById('app')! });
