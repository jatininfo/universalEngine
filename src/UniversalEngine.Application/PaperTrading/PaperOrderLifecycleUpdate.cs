namespace UniversalEngine.Application.PaperTrading;

public sealed record PaperOrderLifecycleUpdate(
    long OrderId,
    PaperOrderStatus? Status,
    DateOnly? ExitDate,
    decimal? ExitPrice,
    decimal? ReturnPercent,
    decimal? RealizedPnl,
    string? SourceReason)
{
    public bool HasChange => Status is not null;

    public static PaperOrderLifecycleUpdate NoChange(long orderId) =>
        new(orderId, null, null, null, null, null, null);
}
