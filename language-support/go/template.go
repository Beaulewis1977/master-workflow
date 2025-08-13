/*
Go Language Support Template
For MASTER-WORKFLOW v3.0
*/

package main

import (
	"encoding/json"
	"fmt"
	"log"
)

// LanguageConfig represents the Go language configuration
type LanguageConfig struct {
	Language   string                 `json:"language"`
	Extensions []string               `json:"extensions"`
	BuildTools BuildTools             `json:"buildTools"`
	Frameworks map[string][]string    `json:"frameworks"`
	Testing    TestingConfig          `json:"testing"`
	Linting    LintingConfig          `json:"linting"`
	Patterns   map[string]interface{} `json:"patterns"`
	DevServer  DevServerConfig        `json:"devServer"`
	Deployment DeploymentConfig       `json:"deployment"`
}

// BuildTools configuration for Go
type BuildTools struct {
	PackageManager       string   `json:"packageManager"`
	ModuleSystem         string   `json:"moduleSystem"`
	BuildCommand         string   `json:"buildCommand"`
	TestCommand          string   `json:"testCommand"`
	LintCommand          string   `json:"lintCommand"`
	FormatCommand        string   `json:"formatCommand"`
	VendorCommand        string   `json:"vendorCommand"`
	ModInit              string   `json:"modInit"`
	AlternativeManagers  []string `json:"alternativeManagers"`
}

// TestingConfig for Go testing frameworks
type TestingConfig struct {
	Unit       []string `json:"unit"`
	Benchmark  []string `json:"benchmark"`
	Coverage   []string `json:"coverage"`
	E2E        []string `json:"e2e"`
	ConfigFile string   `json:"configFile"`
}

// LintingConfig for Go linting and formatting
type LintingConfig struct {
	Linter          string `json:"linter"`
	Config          string `json:"config"`
	Formatter       string `json:"formatter"`
	StaticAnalysis  []string `json:"staticAnalysis"`
	SecurityScanner []string `json:"securityScanner"`
}

// DevServerConfig for Go development
type DevServerConfig struct {
	Command     string `json:"command"`
	DefaultPort int    `json:"defaultPort"`
	HotReload   bool   `json:"hotReload"`
	WatchTool   string `json:"watchTool"`
}

// DeploymentConfig for Go deployment options
type DeploymentConfig struct {
	Platforms        []string `json:"platforms"`
	Containerization string   `json:"containerization"`
	CI               []string `json:"ci"`
	CloudNative      []string `json:"cloudNative"`
}

// GetGoConfig returns the complete Go language configuration
func GetGoConfig() *LanguageConfig {
	return &LanguageConfig{
		Language:   "go",
		Extensions: []string{".go", ".mod", ".sum"},
		BuildTools: BuildTools{
			PackageManager:      "go modules",
			ModuleSystem:        "go.mod",
			BuildCommand:        "go build",
			TestCommand:         "go test ./...",
			LintCommand:         "golangci-lint run",
			FormatCommand:       "gofmt -s -w .",
			VendorCommand:       "go mod vendor",
			ModInit:             "go mod init",
			AlternativeManagers: []string{"dep", "glide", "godep"},
		},
		Frameworks: map[string][]string{
			"web":        {"Gin", "Echo", "Fiber", "Chi", "Gorilla Mux", "Buffalo"},
			"grpc":       {"gRPC-Go", "Twirp", "Connect"},
			"orm":        {"GORM", "Ent", "SQLBoiler", "Squirrel"},
			"testing":    {"Testify", "GoConvey", "Ginkgo", "Gomega"},
			"cli":        {"Cobra", "Urfave CLI", "Kong", "Kingpin"},
			"microservices": {"Go-kit", "Micro", "Kratos", "Go-chassis"},
		},
		Testing: TestingConfig{
			Unit:       []string{"testing", "testify/assert", "testify/mock", "testify/suite"},
			Benchmark:  []string{"testing.B", "benchstat", "gobench"},
			Coverage:   []string{"go test -cover", "gocov", "gcov2lcov"},
			E2E:        []string{"Selenium", "Agouti", "Chromedp"},
			ConfigFile: ".golangci.yml",
		},
		Linting: LintingConfig{
			Linter:          "golangci-lint",
			Config:          ".golangci.yml",
			Formatter:       "gofmt",
			StaticAnalysis:  []string{"go vet", "staticcheck", "gosec", "ineffassign"},
			SecurityScanner: []string{"gosec", "snyk", "nancy"},
		},
		Patterns: map[string]interface{}{
			"concurrency":     "goroutines and channels",
			"errorHandling":   "explicit error returns",
			"interfaceDesign": "small interfaces",
			"dependency":      "dependency injection",
			"configuration":   "environment variables and config structs",
		},
		DevServer: DevServerConfig{
			Command:     "go run main.go",
			DefaultPort: 8080,
			HotReload:   false,
			WatchTool:   "air",
		},
		Deployment: DeploymentConfig{
			Platforms:        []string{"Google Cloud", "AWS", "Azure", "Digital Ocean", "Heroku"},
			Containerization: "Docker",
			CI:               []string{"GitHub Actions", "GitLab CI", "Jenkins", "CircleCI"},
			CloudNative:      []string{"Kubernetes", "Docker Swarm", "Nomad"},
		},
	}
}

func main() {
	config := GetGoConfig()
	jsonData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(jsonData))
}