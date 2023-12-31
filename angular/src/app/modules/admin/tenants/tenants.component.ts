import { Component, Injector } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import {
  PagedListingComponentBase,
  PagedRequestDto,
} from '@shared/paged-listing-component-base';
import {
  TenantServiceProxy,
  TenantDto,
  TenantDtoPagedResultDto,
} from '@shared/service-proxies/service-proxies';
import { CreateTenantDialogComponent } from './create-tenant/create-tenant-dialog.component';
import { EditTenantDialogComponent } from './edit-tenant/edit-tenant-dialog.component';
import { PERMISSIONS_CONSTANT } from '@app/permission/permission';

class PagedTenantsRequestDto extends PagedRequestDto {
  keyword: string;
  isActive: boolean | null;
}

@Component({
  templateUrl: './tenants.component.html',
  animations: [appModuleAnimation()]
})
export class TenantsComponent extends PagedListingComponentBase<TenantDto> {
  tenants: TenantDto[] = [];
  keyword = '';
  isActive: boolean | null;
  advancedFiltersVisible = false;
  constructor(
    injector: Injector,
    private _tenantService: TenantServiceProxy,
    private _modalService: BsModalService
  ) {
    super(injector);
  }
  ngOnInit(): void {
    this.listBreadCrumb = 
    [{name: '<i class="fa-solid fa-house fa-sm"></i>',url:''}, 
    {name: ' <i class="fa-solid fa-chevron-right"></i> '}, 
    {name:'Tenants'}]
    this.refresh();
  }

  isShowCreateBtn(){
    return this.isGranted(PERMISSIONS_CONSTANT.Admin_Tenant_Create);
  }
  isShowEditBtn(){
    return this.isGranted(PERMISSIONS_CONSTANT.Admin_Tenant_Edit);
  }
  isShowDeleteBtn(){
    return this.isGranted(PERMISSIONS_CONSTANT.Admin_Tenant_Delete);
  }

  
  list(
    request: PagedTenantsRequestDto,
    pageNumber: number,
    finishedCallback: Function
  ): void {
    request.keyword = this.keyword;
    request.isActive = this.isActive;

    this._tenantService
      .getAll(
        request.keyword,
        request.isActive,
        request.skipCount,
        request.maxResultCount
      )
      .pipe(
        finalize(() => {
          finishedCallback();
        })
      )
      .subscribe((result: TenantDtoPagedResultDto) => {
        this.tenants = result.items;
        this.showPaging(result, pageNumber);
      });
  }

  onDelete(tenant: TenantDto): void {
    abp.message.confirm(
      this.l('TenantDeleteWarningMessage', tenant.name),
      undefined,
      (result: boolean) => {
        if (result) {
          this._tenantService
            .delete(tenant.id)
            .pipe(
              finalize(() => {
                abp.notify.success(this.l('SuccessfullyDeleted'));
                this.refresh();
              })
            )
            .subscribe(() => {});
        }
      }
    );
  }

  createTenant(): void {
    this.showCreateOrEditTenantDialog();
  }

  editTenant(tenant: TenantDto): void {
    this.showCreateOrEditTenantDialog(tenant.id);
  }

  showCreateOrEditTenantDialog(id?: number): void {
    let createOrEditTenantDialog: BsModalRef;
    if (!id) {
      createOrEditTenantDialog = this._modalService.show(
        CreateTenantDialogComponent,
        {
          class: 'modal-lg',
        }
      );
    } else {
      createOrEditTenantDialog = this._modalService.show(
        EditTenantDialogComponent,
        {
          class: 'modal-lg',
          initialState: {
            id: id,
          },
        }
      );
    }

    createOrEditTenantDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  clearFilters(): void {
    this.keyword = '';
    this.isActive = undefined;
    this.getDataPage(1);
  }
}
