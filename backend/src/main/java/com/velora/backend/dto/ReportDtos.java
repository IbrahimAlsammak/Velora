package com.velora.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Data shapes for the admin "Sales report". */
public final class ReportDtos {

    private ReportDtos() {}

    public enum Period { DAY, WEEK, MONTH }

    /** One bar of the chart: a day, a week (starting Monday) or a month. */
    public record Bucket(LocalDate start, long orders, BigDecimal sales, long items) {}

    /** Numbers for one period, e.g. "this week". */
    public record Summary(long orders, BigDecimal sales, long items, BigDecimal averageOrder) {}

    public record TopProduct(String name, long quantity, BigDecimal sales) {}

    public record SalesReport(
            Period period,
            String timezone,
            List<Bucket> buckets,       // oldest first
            Summary current,            // today / this week / this month
            Summary previous,           // yesterday / last week / last month
            Summary total,              // the whole chart range
            List<TopProduct> topProducts) {}
}
