import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('should generate a new request id if none provided', () => {
    const req: any = { headers: {} };
    const res: any = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(req.headers['x-request-id']).toBe(req.requestId);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('should preserve incoming x-request-id header', () => {
    const existingId = 'client-trace-12345';
    const req: any = { headers: { 'x-request-id': existingId } };
    const res: any = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', existingId);
    expect(next).toHaveBeenCalled();
  });
});
