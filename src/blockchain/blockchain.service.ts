import { Injectable } from '@nestjs/common';

@Injectable()
export class BlockchainService {
  constructor() {
    console.log('Creating default blockchain...');
    console.log('Done. Created default blockchain!');
  }
}
