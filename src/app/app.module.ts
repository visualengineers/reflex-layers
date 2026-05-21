import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DepthImageService } from 'src/services/depth-image.service';
import { TextureRepositoryService } from 'src/services/texture-repository.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DepthImageComponent } from './depth-image/depth-image.component';
import { TextureBlendingComponent } from './texture-blending/texture-blending.component';
import { SettingsComponent } from './settings/settings.component';
import { FormsModule } from '@angular/forms';
import { SettingsService } from 'src/services/settings.service';
import { InteractionService } from 'src/services/interaction.service';
import { DepthLayerVisualizationComponent } from './depth-layer-visualization/depth-layer-visualization.component';
import { LayerLogicService } from 'src/services/layer-logic.service';
import { LayerLogicServiceBase } from 'src/services/layer-logic.service.base';
import { LensVisualizationComponent } from './lens-visualization/lens-visualization.component';
import { PointCloudImageService } from 'src/services/point-cloud-image.service';
import { DepthImageServiceFacade } from 'src/services/depth-image.facade.service';
import { ElectronIpcService } from 'src/services/electron-ipc.service';
import { IdleScreenComponent } from './idle-screen/idle-screen.component';
import { IdleModeService } from 'src/services/idle-mode-service';
import { LensComponent } from './lens/lens.component';
import { DiagnosticsService } from 'src/services/diagnostics.service';

@NgModule({
  declarations: [
    AppComponent,
    DepthImageComponent, TextureBlendingComponent, SettingsComponent, DepthLayerVisualizationComponent, LensVisualizationComponent, IdleScreenComponent, LensComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    { provide: TextureRepositoryService },
    { provide: DepthImageService },
    { provide: LayerLogicServiceBase, useClass: LayerLogicService },
    { provide: InteractionService },
    { provide: SettingsService },
    { provide: PointCloudImageService },
    { provide: DepthImageServiceFacade },
    { provide: ElectronIpcService },
    { provide: IdleModeService },
    { provide: DiagnosticsService}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
