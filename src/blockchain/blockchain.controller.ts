import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
  ) {}

  @ApiOperation({
    summary: 'Get blockchain',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The blockchain was successfully retrieved.',
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  getBlockchain() {
    return this.blockchainService.getBlockchain();
  }
}
