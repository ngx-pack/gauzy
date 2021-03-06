import { Component, OnInit } from '@angular/core';
import {
	Employee,
	Organization,
	OrganizationClients,
	OrganizationProjects,
	OrganizationProjectsCreateInput
} from '@gauzy/models';
import { NbToastrService } from '@nebular/theme';
import { EmployeesService } from 'apps/gauzy/src/app/@core/services';
import { OrganizationClientsService } from 'apps/gauzy/src/app/@core/services/organization-clients.service ';
import { OrganizationEditStore } from 'apps/gauzy/src/app/@core/services/organization-edit-store.service';
import { OrganizationProjectsService } from 'apps/gauzy/src/app/@core/services/organization-projects.service';
import { Store } from 'apps/gauzy/src/app/@core/services/store.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

@Component({
	selector: 'ga-edit-org-projects',
	templateUrl: './edit-organization-projects.component.html',
	styleUrls: ['./edit-organization-projects.component.scss']
})
export class EditOrganizationProjectsComponent implements OnInit {
	private _ngDestroy$ = new Subject<void>();

	organization: Organization;
	showAddCard: boolean;
	projects: OrganizationProjects[];
	clients: OrganizationClients[];
	employees: Employee[] = [];
	projectToEdit: OrganizationProjects;

	constructor(
		private readonly organizationClientsService: OrganizationClientsService,
		private readonly organizationProjectsService: OrganizationProjectsService,
		private readonly toastrService: NbToastrService,
		private store: Store,
		private readonly organizationEditStore: OrganizationEditStore,
		private readonly employeesService: EmployeesService,
		private translateService: TranslateService
	) {}

	ngOnInit(): void {
		this.organizationEditStore.selectedOrganization$
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((organization) => {
				if (organization) {
					this.organization = organization;
					this.loadProjects();
					this.loadEmployees();
					this.loadClients();
				}
			});
	}

	private async loadEmployees() {
		if (!this.organization) {
			return;
		}

		const { items } = await this.employeesService
			.getAll(['user'], { organization: { id: this.organization.id } })
			.pipe(first())
			.toPromise();

		this.employees = items;
	}

	async removeProject(id: string, name: string) {
		await this.organizationProjectsService.delete(id);

		this.toastrService.primary(
			this.getTranslation(
				'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_PROJECTS.REMOVE_PROJECT',
				{
					name: name
				}
			),
			this.getTranslation('TOASTR.TITLE.SUCCESS')
		);

		this.loadProjects();
	}

	cancel() {
		this.projectToEdit = null;
		this.showAddCard = !this.showAddCard;
	}

	private async addOrEditProject(project: OrganizationProjectsCreateInput) {
		if (project.name) {
			await this.organizationProjectsService.create(project);

			this.toastrService.primary(
				this.getTranslation(
					'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_PROJECTS.ADD_PROJECT',
					{
						name: project.name
					}
				),
				this.getTranslation('TOASTR.TITLE.SUCCESS')
			);

			this.projectToEdit = null;
			this.showAddCard = !this.showAddCard;
			this.loadProjects();
		} else {
			this.toastrService.danger(
				this.getTranslation(
					'NOTES.ORGANIZATIONS.EDIT_ORGANIZATIONS_PROJECTS.INVALID_PROJECT_NAME'
				),
				this.getTranslation(
					'TOASTR.MESSAGE.NEW_ORGANIZATION_PROJECT_INVALID_NAME'
				)
			);
		}
	}

	private async loadProjects() {
		if (!this.organization) {
			return;
		}

		const res = await this.organizationProjectsService.getAll(
			['client', 'members', 'members.user'],
			{
				organizationId: this.organization.id
			}
		);
		if (res) {
			this.projects = res.items;
		}
	}

	private async loadClients() {
		if (!this.organization) {
			return;
		}

		const res = await this.organizationClientsService.getAll(['projects'], {
			organizationId: this.organization.id
		});
		if (res) {
			this.clients = res.items;
		}
	}

	async editProject(project: OrganizationProjects) {
		this.projectToEdit = project;
		this.showAddCard = true;
	}

	getTranslation(prefix: string, params?: Object) {
		let result = '';
		this.translateService.get(prefix, params).subscribe((res) => {
			result = res;
		});

		return result;
	}
}
