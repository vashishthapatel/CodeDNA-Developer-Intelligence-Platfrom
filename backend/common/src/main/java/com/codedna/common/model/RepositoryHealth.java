package com.codedna.common.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryHealth {
    private Integer codeQuality;
    private Integer complexity;
    private Integer documentation;
    private Integer testing;
    private Integer maintainability;
}
