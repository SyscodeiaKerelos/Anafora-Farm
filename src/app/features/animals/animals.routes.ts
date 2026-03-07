import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { AnimalDetailPage } from './animal-detail.page';
import { SpeciesService } from './services/species.service';
import { AnimalsService } from './services/animals.service';
import { AnimalCommentsService } from './services/animal-comments.service';
import { AnimalsPage } from './animals.page';

export const ANIMALS_ROUTES: Routes = [
  {
    path: '',
    component: AnimalsPage,
    providers: [SpeciesService, AnimalsService, AnimalCommentsService],
  },
  {
    path: ':id',
    component: AnimalDetailPage,
    providers: [SpeciesService, AnimalsService, AnimalCommentsService],
  },
];
