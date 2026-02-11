import type { IAssignmentService } from './interfaces/IAssignmentService';
import type { ICareerService } from './interfaces/ICareerService';
import type { IUserService } from './interfaces/IUserService';
import type { IPCSService } from './interfaces/IPCSService';
import type { IInboxService } from './interfaces/IInboxService';
import type { ILeaveService } from './interfaces/ILeaveService';

import { mockAssignmentService } from './mockAssignmentService';
import { mockCareerService } from './mockCareerService';
import { mockUserService } from './mockUserService';
import { mockPCSService } from './mockPCSService';
import { mockInboxService } from './mockInboxService';
import { mockLeaveService } from './mockLeaveService';

export interface ServiceRegistry {
    assignment: IAssignmentService;
    career: ICareerService;
    user: IUserService;
    pcs: IPCSService;
    inbox: IInboxService;
    leave: ILeaveService;
}

export const services: ServiceRegistry = {
    assignment: mockAssignmentService,
    career: mockCareerService,
    user: mockUserService,
    pcs: mockPCSService,
    inbox: mockInboxService,
    leave: mockLeaveService,
};
