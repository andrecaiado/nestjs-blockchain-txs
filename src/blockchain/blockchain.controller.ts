import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { BlockchainDto } from './dto/blockchain.dto';
import { BlockDto } from 'src/blocks/dto/block.dto';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
  ) {}

  @ApiOperation({
    summary: 'Get blockchain status and blocks preview',
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

  @ApiOperation({
    summary: 'Get block by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The block was successfully retrieved',
    type: BlockDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: `The block was not found.`,
  })
  @HttpCode(HttpStatus.OK)
  @Get('block/:blockId')
  getBlock(@Param('blockId') blockId: string): BlockDto {
    return this.blockchainService.getBlock(blockId);
  }
}
