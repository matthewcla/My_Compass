import type { IAssignmentService } from './interfaces/IAssignmentService';
import type { ICareerService } from './interfaces/ICareerService';
import type { IDPSService } from './interfaces/IDPSService';
import type { IInboxService } from './interfaces/IInboxService';
import type { ILeaveService } from './interfaces/ILeaveService';
import type { IPCSService } from './interfaces/IPCSService';
import type { IUserService } from './interfaces/IUserService';

import { mockAssignmentService } from './mockAssignmentService';
import { mockCareerService } from './mockCareerService';
import { mockDPSService } from './mockDPSService';
import { mockInboxService } from './mockInboxService';
import { mockLeaveService } from './mockLeaveService';
import { mockPCSService } from './mockPCSService';
import { mockUserService } from './mockUserService';

export interface ServiceRegistry {
    assignment: IAssignmentService;
    career: ICareerService;
    dps: IDPSService;
    user: IUserService;
    pcs: IPCSService;
    inbox: IInboxService;
    leave: ILeaveService;
}

export const services: ServiceRegistry = {
    assignment: mockAssignmentService,
    career: mockCareerService,
    dps: mockDPSService,
    user: mockUserService,
    pcs: mockPCSService,
    inbox: mockInboxService,
    leave: mockLeaveService,
};
