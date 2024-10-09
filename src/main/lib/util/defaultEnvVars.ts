import { app } from 'electron';

process.env.RUST_LOG ||= 'info';
if (app.isPackaged) {
  process.env.DEBUG = [process.env.DEBUG ?? '', 'ulx:*'].filter(Boolean).join(',');
  process.env.NODE_DISABLE_COLORS = 'true';
} else {
  process.env.DEBUG = [process.env.DEBUG ?? '', 'ulx:*'].filter(Boolean).join(',');
}
