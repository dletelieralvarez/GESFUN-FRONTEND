import { Component } from '@angular/core';
import { AGENDA, AG_COLOR, SALAS } from '../../data/mock-data';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent {
  agenda = AGENDA;
  salas = SALAS;
  hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  agColor = AG_COLOR;

  get eventsToday() {
    return this.agenda.filter((a) => a.color !== 'neutral');
  }

  eventAt(hour: number, salaIndex: number) {
    return this.agenda.find((a) => a.sala === salaIndex && a.start === hour);
  }

  getEventsCount(salaIndex: number) {
    return this.agenda.filter((a) => a.sala === salaIndex).length;
  }

  getEventStyle(ev: any) {
    const color = this.agColor[ev.color as keyof typeof this.agColor] || this.agColor.neutral;
    return {
      height: (ev.end - ev.start) * 46 - 4 + 'px',
      background: color.bg,
      borderLeftColor: color.bar,
      color: color.fg,
      cursor: 'pointer'
    };
  }

  formatHour(hour: number) {
    return hour.toString().padStart(2, '0') + ':00';
  }

  isOccupied(salaIndex: number) {
    return this.agenda.some((a) => a.sala === salaIndex && a.color === 'ok');
  }
}
