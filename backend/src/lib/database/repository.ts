import { NotFoundException } from '@nestjs/common';
import { FilterQuery, Model, PopulateOptions, UpdateQuery } from 'mongoose';
import { z, ZodSchema } from 'zod';

class GenericNotFoundException<TModel> extends NotFoundException {
  constructor(model: Model<TModel>) {
    super(`${model.name} not found`);
  }
}

export abstract class BaseRepository<
  TModel,
  TCreateOneSchema extends ZodSchema,
> {
  protected constructor(
    private readonly model: Model<TModel>,
    private readonly createOneSchema: TCreateOneSchema,
  ) {}

  public async createOne(createOneDto: z.infer<TCreateOneSchema>) {
    return this.model.create(this.createOneSchema.parse(createOneDto));
  }

  public async createMany(createManyDto: z.infer<TCreateOneSchema>[]) {
    this.model.insertMany(
      createManyDto.map((createOneDto) =>
        this.createOneSchema.parse(createOneDto),
      ),
    );
  }

  public async findOneByIdOrFail<TPopulate>(
    id: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .findById(id)
      .orFail(new GenericNotFoundException(this.model))
      .populate<TPopulate>(populate || [])
      .lean()
      .exec();
  }

  protected async findOneByConditionOrFail<TPopulate>(
    condition: FilterQuery<TModel>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .findOne(condition)
      .populate<TPopulate>(populate || [])
      .orFail(new GenericNotFoundException(this.model))
      .lean()
      .exec();
  }

  protected async findByCondition<TPopulate>(
    condition: FilterQuery<TModel>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .find(condition)
      .populate<TPopulate>(populate || [])
      .lean()
      .exec();
  }

  protected async updateOneByIdOrFail<TPopulate>(
    id: string,
    updateQuery: UpdateQuery<TModel>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .findByIdAndUpdate(id, updateQuery, {
        returnDocument: 'after',
      })
      .populate<TPopulate>(populate || [])
      .orFail(new GenericNotFoundException(this.model))
      .lean()
      .exec();
  }

  protected async updateOneByConditionOrFail<TPopulate>(
    condition: FilterQuery<TModel>,
    updateQuery: UpdateQuery<TModel>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .findOneAndUpdate(condition, updateQuery, {
        returnDocument: 'after',
      })
      .populate<TPopulate>(populate || [])
      .orFail(new GenericNotFoundException(this.model))
      .lean()
      .exec();
  }

  public async deleteOneByIdOrFail<TPopulate>(
    id: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .findByIdAndDelete(id, { returnDocument: 'before' })
      .populate<TPopulate>(populate || [])
      .orFail(new GenericNotFoundException(this.model))
      .lean()
      .exec();
  }

  protected async deleteOneByConditionOrFail<TPopulate>(
    condition: FilterQuery<TModel>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
  ) {
    return this.model
      .findOneAndDelete(condition, { returnDocument: 'before' })
      .populate<TPopulate>(populate || [])
      .orFail(new GenericNotFoundException(this.model))
      .lean()
      .exec();
  }
}
