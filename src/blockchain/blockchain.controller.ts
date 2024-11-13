import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { BlockchainDto } from './dto/blockchain.dto';

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
    type: BlockchainDto,
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  getBlockchain(): BlockchainDto {
    return this.blockchainService.getBlockchainDto();
  }
}
