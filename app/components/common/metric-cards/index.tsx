"use client";

import React, { type ReactNode } from "react";
import styles from "./metric-cards.module.css";

export interface MetricCardItem {
  key: string;
  title: string;
  count: number;
  caption?: string;
  color?: string;
  bgSoft?: string;
  icon?: ReactNode;
}

export interface MetricCardsProps {
  items: MetricCardItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  className?: string;
}

export default function MetricCardsGroup({
  items,
  activeKey,
  onSelect,
  className = "",
}: MetricCardsProps) {
  return (
    <div className={`${styles.cardsGrid} ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        const color = item.color || "#2563eb";
        const bgSoft = item.bgSoft || "#eff6ff";

        return (
          <div
            key={item.key}
            className={`${styles.metricCard} ${
              isActive ? styles.metricCardActive : ""
            }`}
            style={
              isActive
                ? {
                    borderColor: color,
                    background: bgSoft,
                  }
                : undefined
            }
            onClick={() => onSelect(item.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item.key);
              }
            }}
          >
            {isActive && (
              <div
                className={styles.activeIndicator}
                style={{ background: color }}
              />
            )}

            <div className={styles.cardHeader}>
              <div className={styles.iconTitleGroup}>
                {item.icon && (
                  <div
                    className={styles.cardIcon}
                    style={{
                      background: bgSoft,
                      color: color,
                    }}
                  >
                    {item.icon}
                  </div>
                )}
                <span className={styles.cardTitle}>{item.title}</span>
              </div>
            </div>

            <div className={styles.countGroup}>
              <div className={styles.countNumber}>{item.count}</div>
              {item.caption && (
                <div className={styles.cardCaption}>{item.caption}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
