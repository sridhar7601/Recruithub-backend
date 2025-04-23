import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';
import { Panel, PanelSchema } from './panel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Panel.name, schema: PanelSchema }])
  ],
  controllers: [PanelController],
  providers: [PanelService],
  exports: [PanelService],
})
export class PanelModule {}
