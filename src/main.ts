import { createApp, startApp } from './app';
import './styles.css';

const header = document.getElementById('header')!;
const content = document.getElementById('content')!;

void startApp(createApp(header, content));
