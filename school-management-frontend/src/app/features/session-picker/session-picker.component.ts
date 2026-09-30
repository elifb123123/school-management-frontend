import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-session-picker',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './session-picker.component.html',
  styleUrl: './session-picker.component.scss'
})
export class SessionPickerComponent {}
