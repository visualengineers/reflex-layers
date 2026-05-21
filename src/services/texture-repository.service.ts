import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, map, Observable, Subscription, tap } from "rxjs";
import { environment } from "src/environments/environment";
import { TextureRepository } from "src/shared/interface/texture-repository";
import { TextureResource } from "src/shared/interface/texture-resource";
import { SettingsService } from "./settings.service";
import { TextureLayer } from "src/shared/interface/texture-layer";
import { TextureResourceType } from "src/shared/enum/texture-resource-type";
import log from "electron-log";
import { DiagnosticsService } from "./diagnostics.service";
import { DiagnosticsData } from "src/shared/util/diagnostics-data.interface";

@Injectable()
export class TextureRepositoryService {
    private readonly numIdleLayers = 7;

    public SelectedTextureId: BehaviorSubject<number>;

    public NumLayers: BehaviorSubject<number> = new BehaviorSubject(1);

    private _settingsSubscription: Subscription;

    public constructor(
      private readonly _httpClient: HttpClient,
      private readonly _settingsService: SettingsService,
      private readonly _diagnosticService: DiagnosticsService
    ) {
        this.SelectedTextureId = new BehaviorSubject<number>(_settingsService.CurrentSettings.value.defaultResourceId);

        this._settingsSubscription = this._settingsService.CurrentSettings.subscribe(
            {
              next: (settings) => {
                if (this.SelectedTextureId.value !== settings.defaultResourceId) {
                    this.SelectedTextureId.next(settings.defaultResourceId);
                }
              },
              error: (error) => {
                console.error(error);
                log.error(error);
              }
            }
          );
    }

    public retrieveData(): Observable<TextureRepository> {
        return this._httpClient.get<TextureRepository>(environment.dataRepository).pipe(
            map((repo) => {
                repo.textureResources = repo.textureResources
                    .filter((resource) => resource.isActive ?? false)
                    .sort((resource1, resource2) => resource1.id - resource2.id);
                return repo;
            })
        );
    }

    public retrieveTextureResource(id: number): Observable<TextureResource | undefined> {
        return this.retrieveData().pipe(
            map((repo: TextureRepository) => {
                const result = repo.textureResources.find(res => res.id === (id as number)) ?? repo.textureResources[0];
                if (result !== undefined) {
                    result.layers = result.layers.sort((layer1, layer2) => layer1.id - layer2.id)
                }
                return this.computeIdleLayers(result);
            }),
            tap((resource:TextureResource | undefined) => this.updateNumLayers(resource)),
            tap((resource:TextureResource | undefined) => this._settingsService.updateLayerSettings(resource)),
            tap((resource:TextureResource | undefined) => this.reportTextureResourceChanged(resource))
        )
    }

    private updateNumLayers(resource?: TextureResource): void {
        if (resource == undefined) {
            return;
        }

        this.NumLayers.next(resource.numLayers ?? resource.layers?.length ?? 1);
    }

    private computeIdleLayers(resource: TextureResource): TextureResource {
        if (resource.type !== TextureResourceType.Texture2d ||
            (resource.idleLayers !== undefined && resource.idleLayers.length === this.numIdleLayers)) {
            return resource;
        }

        const computedLayers = new Array<TextureLayer>();
        const offset = Math.floor(resource.layers.length / this.numIdleLayers);

        for (let i = 0; i < this.numIdleLayers; i++) {
            const tex = resource.layers[i*offset];
            computedLayers.push(tex);
        };

        resource.idleLayers = computedLayers;

        return resource;
    }

    private reportTextureResourceChanged(resource?: TextureResource) {

      const data: DiagnosticsData = {
        eventTypeDescription: 'TextureChanged',
        data1: `${resource?.id ?? '-1'}`,
        data2: resource?.name ?? '-',
        remarks: `${resource?.type}|${resource?.numLayers}|${resource?.config?.interaction}|${resource?.config?.showLayerUI}|${resource?.config?.showLenseUI}`
      }

      this._diagnosticService.submit(data);
    }
}
